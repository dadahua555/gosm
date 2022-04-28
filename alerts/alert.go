package alerts

import (
	"fmt"
	"gosm/models"
	"time"
)

// SendAlerts Sends the alerts for a services current status
func SendAlerts(service models.Service) {
	currentTimeData := time.Now().Format("2006-01-02 15:04:05")
	if models.CurrentConfig.Verbose {
		fmt.Println(currentTimeData + "  " + service.Name + " is now in the " + service.Status + " state")
	}
	if models.CurrentConfig.SendEmail {
		sendSMTPAlert(service)
	}
	if models.CurrentConfig.SendSMS {
		sendSMSAlert(service)
	}
}

func SendSMTPTest() {
	sendSMTPTest()
}
