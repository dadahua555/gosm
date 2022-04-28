package checker

import (
	"fmt"
	"gosm/alerts"
	"gosm/models"
	"strconv"
	"time"
)

var (
	checkChannel chan (*models.Service)
)

// Start Starts the service checker process
func Start() {
	checkChannel = make(chan *models.Service, models.CurrentConfig.MaxConcurrentChecks)
	go processChecks()
	go checkOnlineServices()
	go ClearArchive()
	checkPendingOfflineServices()
}

func checkOnlineServices() {
	for {
		for i := range models.CurrentServices {
			if len(models.CurrentServices) <= i {
				break
			}
			if models.CurrentServices[i].Status == models.Online {
				checkChannel <- &models.CurrentServices[i]
			}
		}
		time.Sleep(time.Second * time.Duration(models.CurrentConfig.CheckInterval))
	}
}

func checkPendingOfflineServices() {
	for {
		for i := range models.CurrentServices {
			if len(models.CurrentServices) <= i {
				break
			}
			if models.CurrentServices[i].Status != models.Online {
				checkChannel <- &models.CurrentServices[i]
			}
		}
		time.Sleep(time.Second * time.Duration(models.CurrentConfig.PendingOfflineCheckInterval))
	}
}

func ClearArchive() {
	for {
		models.Database.MustExec("delete from checklog where logtime < date('now','start of day','-" + strconv.Itoa(models.CurrentConfig.ArchiveDay) + " day')")
		time.Sleep(time.Second * 3600)
	}
}

func processChecks() {
	for {
		service := <-checkChannel
		if service.Enabled == 0 {
			logtime := time.Now().Format("2006-01-02 15:04:05")
			models.Database.MustExec("INSERT INTO checklog (id, status, logtime) VALUES(" + strconv.Itoa(service.ID) + ",0,'" + logtime + "')")
			continue
		}
		online := service.CheckService()
		currentTimeData := time.Now().Format("2006-01-02 15:04:05")
		logtime := time.Now().Format("2006-01-02 15:04:05")
		if online == true {
			models.Database.MustExec("INSERT INTO checklog (id, status, logtime) VALUES(" + strconv.Itoa(service.ID) + ",1,'" + logtime + "')")
			if service.Status == models.Offline {
				service.Status = models.Online
				service.UptimeStart = time.Now().Unix()
				go alerts.SendAlerts(*service)
			} else if service.Status == models.Pending {
				service.Status = models.Online
				if models.CurrentConfig.Verbose {
					fmt.Println(currentTimeData + "  " + service.Name + " is now in the " + service.Status + " state")
				}
			}
			service.FailureCount = 0
		} else {
			models.Database.MustExec("INSERT INTO checklog (id, status, logtime) VALUES(" + strconv.Itoa(service.ID) + ",-1,'" + logtime + "')")
			if service.Status == models.Online {
				service.Status = models.Pending
				service.FailureCount = 1
				service.FailtimeStart = time.Now().Unix()
				if models.CurrentConfig.Verbose {
					fmt.Println(currentTimeData + "  " + service.Name + " is now in the " + service.Status + " state")
				}
			} else if service.Status == models.Pending {
				service.FailureCount++
				if service.FailureCount >= models.CurrentConfig.FailedCheckThreshold {
					service.Status = models.Offline
					go alerts.SendAlerts(*service)
				}
			}
		}
	}
}
