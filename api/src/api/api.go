package api

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/donovansolms/cosmos-inscriptions/api/src/api/models"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// API implements the reference indexer API
type API struct {
	chainID                  string
	lcdEndpoint              string
	blockPollIntervalSeconds int
	server                   *http.Server
	logger                   *logrus.Entry

	stopChannel chan bool
	db          *gorm.DB
}

// New returns a new instance of the indexer service and returns an error if
// there was a problem setting up the service
func New(chainID string, databaseDSN string, lcdEndpoint string, blockPollIntervalSeconds int, log *logrus.Entry) (*API, error) {

	db, err := gorm.Open(mysql.Open(databaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err

	}

	return &API{
		chainID:                  chainID,
		lcdEndpoint:              lcdEndpoint,
		blockPollIntervalSeconds: blockPollIntervalSeconds,
		logger:                   log,
		stopChannel:              make(chan bool),
		db:                       db,
	}, nil
}

func (i *API) Run() error {
	i.logger.Info("Starting API")

	corsOptions := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}), // Allows all origins
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "X-Requested-With"}),
		// You can include other settings like `handlers.AllowCredentials()`, etc.
	)

	// Create a new router using Gorilla Mux
	router := mux.NewRouter()

	// Define routes
	router.HandleFunc("/", i.homeHandler)
	router.HandleFunc("/inscription/{hash}", i.inscriptionHandler)
	router.HandleFunc("/inscriptions", i.inscriptionsHandler)
	// router.HandleFunc("/about", aboutHandler)

	// Create a new server
	i.server = &http.Server{
		Addr:    ":8080",
		Handler: corsOptions(router), // Set the router as the server's handler
	}

	go func() {
		if err := i.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			i.logger.Fatalf("ListenAndServe(): %v", err)
		}
	}()
	i.logger.Println("Server started on port 8080")

	// Block until a signal is received
	<-i.stopChannel

	// Create a deadline to wait for
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Doesn't block if no connections, but will wait until the timeout deadline
	i.server.Shutdown(ctx)

	i.logger.Println("Server gracefully stopped")

	return nil
}

func (i *API) Stop() error {
	i.logger.Info("Stopping indexer")
	i.stopChannel <- true
	return nil
}

// Example route handler
func (i *API) homeHandler(w http.ResponseWriter, r *http.Request) {
	i.logger.Info("Home handler")
	w.Write([]byte("Hello, this is the home page."))
}

func (i *API) inscriptionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	hash := vars["hash"]

	var inscription models.Inscription
	result := i.db.First(&inscription, "hash = ?", hash)
	if result.Error != nil {
		i.logger.Error(result.Error)

		response := APIResponse{Message: fmt.Sprintf("Inscription not found: %s", hash)}
		json.NewEncoder(w).Encode(response)
		return
	}

	i.logger.WithFields(logrus.Fields{
		"hash": hash,
	}).Info("Inscription queried")

	var parent InscriptionParent
	json.Unmarshal([]byte(inscription.Parent), &parent)

	var metadata ContentGenericMetadata
	metadataJSON, _ := base64.StdEncoding.DecodeString(inscription.MetadataBase64)
	json.Unmarshal([]byte(metadataJSON), &metadata)

	response := GenericContentResponse{
		ID:       inscription.ID,
		Height:   inscription.Height,
		Hash:     inscription.Hash,
		Creator:  inscription.Creator,
		Owner:    inscription.Owner,
		Parent:   parent,
		Type:     inscription.Type,
		Metadata: metadata,
		// ContentBase64: inscription.ContentBase64,
		ContentPath: inscription.ContentPath,
		DateCreated: inscription.DateCreated,
	}

	json.NewEncoder(w).Encode(response)
}

func (i *API) inscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var inscriptions []models.Inscription
	result := i.db.Order("id desc").Find(&inscriptions)
	if result.Error != nil {
		i.logger.Error(result.Error)

		response := APIResponse{Message: "Inscriptions not found"}
		json.NewEncoder(w).Encode(response)
		return
	}

	i.logger.WithFields(logrus.Fields{
		"count": len(inscriptions),
	}).Info("Inscriptions queried")

	var response []GenericContentResponse

	for _, inscription := range inscriptions {
		var parent InscriptionParent
		json.Unmarshal([]byte(inscription.Parent), &parent)

		var metadata ContentGenericMetadata
		metadataJSON, _ := base64.StdEncoding.DecodeString(inscription.MetadataBase64)
		json.Unmarshal([]byte(metadataJSON), &metadata)

		response = append(response, GenericContentResponse{
			ID:          inscription.ID,
			Height:      inscription.Height,
			Hash:        inscription.Hash,
			Creator:     inscription.Creator,
			Owner:       inscription.Owner,
			Parent:      parent,
			Type:        inscription.Type,
			Metadata:    metadata,
			ContentPath: inscription.ContentPath,
			DateCreated: inscription.DateCreated,
		})
	}

	// var parent InscriptionParent
	// json.Unmarshal([]byte(inscription.Parent), &parent)

	// var metadata ContentGenericMetadata
	// metadataJSON, _ := base64.StdEncoding.DecodeString(inscription.MetadataBase64)
	// json.Unmarshal([]byte(metadataJSON), &metadata)

	// response := GenericContentResponse{
	// 	ID:            inscription.ID,
	// 	Height:        inscription.Height,
	// 	Hash:          inscription.Hash,
	// 	Creator:       inscription.Creator,
	// 	Owner:         inscription.Owner,
	// 	Parent:        parent,
	// 	Type:          inscription.Type,
	// 	Metadata:      metadata,
	// 	ContentBase64: inscription.ContentBase64,
	// 	DateCreated:   inscription.DateCreated,
	// }

	json.NewEncoder(w).Encode(response)
}
