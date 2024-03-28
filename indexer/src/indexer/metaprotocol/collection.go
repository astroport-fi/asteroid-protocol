package metaprotocol

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"
)

type CollectionReservation struct {
	Name    string
	Ticker  string
	Address string
}

func GetReservations(fileName string) (map[string]CollectionReservation, map[string]CollectionReservation) {
	// open CSV file
	fd, error := os.Open(fileName)
	if error != nil {
		fmt.Println(error)
	}
	defer fd.Close()

	// read CSV file
	reader := csv.NewReader(fd)
	_, err := reader.Read() // skip header
	if err != nil {
		log.Fatal(err)
	}

	reservationsByName := make(map[string]CollectionReservation)
	reservationsByTicker := make(map[string]CollectionReservation)

	for {
		record, err := reader.Read()
		if err != nil {
			break
		}

		project := CollectionReservation{
			Name:    strings.TrimSpace(record[1]),
			Ticker:  strings.ToUpper(strings.TrimSpace(record[2])),
			Address: strings.TrimSpace(record[3]),
		}
		reservationsByName[project.Name] = project
		reservationsByTicker[project.Ticker] = project
	}

	return reservationsByName, reservationsByTicker
}
