package nsfw

import (
	"strings"

	"github.com/gabriel-vasile/mimetype"
	"github.com/sirupsen/logrus"
)

func NewWorker(log *logrus.Entry, modelPath string, enabled bool) *Worker {
	worker := Worker{
		modelPath: modelPath,
		work:      make(chan []byte),
		result:    make(chan bool),
		quitChan:  make(chan bool),
		logger: log.WithFields(logrus.Fields{
			"worker": "nsfw",
		}),
		enabled: enabled,
	}

	if !enabled {
		worker.logger.Info("NSFW worker disabled")
	}

	return &worker
}

type Worker struct {
	modelPath string
	enabled   bool
	work      chan []byte
	result    chan bool
	quitChan  chan bool
	logger    *logrus.Entry
}

func (w *Worker) Start() {
	go func() {
		predictor, err := NewPredictorFromPath(w.modelPath)
		if err != nil {
			w.logger.Fatal("unable to create predictor", err)
		}

		for {
			select {
			case work := <-w.work:
				mtype := mimetype.Detect(work)
				split := strings.Split(mtype.Extension(), ".")
				ext := strings.ToLower(split[len(split)-1])

				w.logger.Debugf("New Task with ext: %s", ext)

				prediction, err := predictor.Predict(work, ext)
				var res bool
				if err == nil {
					res = prediction.IsNSFW()
				} else {
					res = false
				}

				w.logger.Infof("Task finished: %s, IsExplicit: %t", ext, res)

				w.result <- res

			case <-w.quitChan:
				w.logger.Info("worker stopping")
				return
			}
		}
	}()
}

func (w *Worker) Stop() {
	go func() {
		w.quitChan <- true
	}()
}

func (w *Worker) CheckImage(image []byte) bool {
	if !w.enabled {
		return false
	}

	w.work <- image
	isExplicit := <-w.result
	return isExplicit
}
