package nsfw

import (
	"strings"

	"github.com/gabriel-vasile/mimetype"
	"github.com/sirupsen/logrus"
)

func NewWorker(log *logrus.Entry) *Worker {
	worker := Worker{
		work:     make(chan []byte),
		result:   make(chan bool),
		quitChan: make(chan bool),
		logger: log.WithFields(logrus.Fields{
			"worker": "nsfw",
		}),
	}

	return &worker
}

type Worker struct {
	work     chan []byte
	result   chan bool
	quitChan chan bool
	logger   *logrus.Entry
}

func (w Worker) Start(modelPath string) {
	go func() {
		predictor, err := NewPredictorFromPath(modelPath)
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

func (w Worker) Stop() {
	go func() {
		w.quitChan <- true
	}()
}

func (w Worker) Add(image []byte) <-chan bool {
	w.work <- image
	return w.result
}
