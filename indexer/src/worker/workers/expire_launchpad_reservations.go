package workers

import (
	"context"
	"time"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/riverqueue/river"
	"gorm.io/gorm"
)

const ExpireLaunchpadReservationPeriod = 15 * time.Minute

type ExpireLaunchpadReservationArgs struct {
}

func (ExpireLaunchpadReservationArgs) Kind() string { return "expire-launchpad-reservation" }

func (ExpireLaunchpadReservationArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{
		UniqueOpts: river.UniqueOpts{
			ByArgs:   true,
			ByPeriod: ExpireLaunchpadReservationPeriod,
		},
	}
}

type ExpireLaunchpadReservationWorker struct {
	DB *gorm.DB
	river.WorkerDefaults[ExpireLaunchpadReservationArgs]
}

func (w *ExpireLaunchpadReservationWorker) Work(ctx context.Context, job *river.Job[ExpireLaunchpadReservationArgs]) error {
	// select launch reservations that have date_created older than 60 minutes with gorm
	var reservations []models.LaunchpadMintReservation
	err := w.DB.Where("is_minted is false and date_created < NOW() - interval '60 minutes'").Find(&reservations).Error
	if err != nil {
		return err
	}

	// go through each reservation
	for _, reservation := range reservations {
		// get launchpad reveal_date and reveal_immediately
		var launchpad models.Launchpad
		err := w.DB.Where("id = ?", reservation.LaunchpadID).First(&launchpad).Error
		if err != nil {
			return err
		}

		// if reveal_immediately is true, expire the reservation and update the launchpad minted supply
		if launchpad.RevealImmediately {
			reservation.IsExpired = true

			err := w.DB.Save(&reservation).Error
			if err != nil {
				return err
			}

			launchpad.MintedSupply -= 1
			err = w.DB.Save(&launchpad).Error
			if err != nil {
				return err
			}
		} else {
			if launchpad.RevealDate.Valid {
				// if reveal_date is set and older than 1 hour, expire the reservation and update the launchpad minted supply
				if launchpad.RevealDate.Time.Before(time.Now().UTC().Add(-time.Hour)) {
					reservation.IsExpired = true

					err := w.DB.Save(&reservation).Error
					if err != nil {
						return err
					}

					launchpad.MintedSupply -= 1
					err = w.DB.Save(&launchpad).Error
					if err != nil {
						return err
					}
				}
			} else if launchpad.MaxSupply > 0 && launchpad.MintedSupply >= launchpad.MaxSupply {
				// get latest created reservation from the launchpad
				var latestReservation models.LaunchpadMintReservation
				err := w.DB.Where("launchpad_id = ?", launchpad.ID).Order("date_created desc").First(&latestReservation).Error
				if err != nil {
					return err
				}

				// if the latest reservation is older than 1 hour, expire the reservation and update the launchpad minted supply
				if latestReservation.DateCreated.Before(time.Now().UTC().Add(-time.Hour)) {
					reservation.IsExpired = true

					err := w.DB.Save(&reservation).Error
					if err != nil {
						return err
					}

					launchpad.MintedSupply -= 1
					err = w.DB.Save(&launchpad).Error
					if err != nil {
						return err
					}
				}
			}
		}

	}

	return nil
}
