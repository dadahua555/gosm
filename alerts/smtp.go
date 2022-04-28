package alerts

import (
	"encoding/base64"
	"fmt"
	"gosm/models"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

func sendSMTPAlert(service models.Service) {
	auth := smtp.PlainAuth("",
		models.CurrentConfig.SMTPUsername,
		models.CurrentConfig.SMTPPassword,
		models.CurrentConfig.SMTPHost)
	smtpAuth := strconv.FormatBool(models.CurrentConfig.SMTPAuth)
	if smtpAuth == "false" {
		auth = nil
	}
	strsubject := "探活检测报警：" + service.Name + " 状态为 " + service.Status
	subject := base64.StdEncoding.EncodeToString([]byte(strsubject))
	content_type := "Content-Type: text/html" + "; charset=UTF-8"
	message := "Subject:  =?utf-8?b?" + subject + "?=" + "\r\n"
	message += content_type + "\r\n\r\n"
	message += service.Name + " is now " + service.Status + "<br>"
	message += "协议: " + service.Protocol + "<br>"
	message += "地址: " + service.Host + "<br>"
	message += "离线时间: " + time.Unix(service.FailtimeStart, 0).Format("2006-01-02 15:04:05") + "<br>"
	currentTimeData := time.Now().Format("2006-01-02 15:04:05")
	if service.Port.Value != nil {
		message += "Port: " + strconv.FormatInt(service.Port.Int64, 10) + "<br>"
	}
	recemails := strings.Split(service.Emails, ";")
	if len(recemails) == 0 {
		recemails = models.CurrentConfig.EmailRecipients
	}
	err := smtp.SendMail(
		models.CurrentConfig.SMTPHost+":"+strconv.Itoa(models.CurrentConfig.SMTPPort),
		auth, models.CurrentConfig.SMTPEmailAddress,
		recemails,
		[]byte(message))
	if err != nil {
		fmt.Printf("%s  SMTP告警邮件发送失败, 服务器：%s, 端口：%d, 发件箱：%s, 收件箱：%v\n", currentTimeData, models.CurrentConfig.SMTPHost, models.CurrentConfig.SMTPPort, models.CurrentConfig.SMTPEmailAddress, recemails)
		fmt.Println(err)
	} else {
		fmt.Printf("%s  SMTP告警邮件发送成功, 服务器：%s, 端口：%d, 发件箱：%s, 收件箱：%v \n", currentTimeData, models.CurrentConfig.SMTPHost, models.CurrentConfig.SMTPPort, models.CurrentConfig.SMTPEmailAddress, recemails)
	}
}

func sendSMTPTest() {
	auth := smtp.PlainAuth("",
		models.CurrentConfig.SMTPUsername,
		models.CurrentConfig.SMTPPassword,
		models.CurrentConfig.SMTPHost)
	smtpAuth := strconv.FormatBool(models.CurrentConfig.SMTPAuth)
	if smtpAuth == "false" {
		auth = nil
	}
	strsubject := "探活检测邮件测试"
	subject := base64.StdEncoding.EncodeToString([]byte(strsubject))
	content_type := "Content-Type: text/html" + "; charset=UTF-8"
	message := "Subject:  =?utf-8?b?" + subject + "?=" + "\r\n"
	message += content_type + "\r\n\r\n"
	message += "邮件测试正文" + "<br>"
	err := smtp.SendMail(
		models.CurrentConfig.SMTPHost+":"+strconv.Itoa(models.CurrentConfig.SMTPPort),
		auth, models.CurrentConfig.SMTPEmailAddress,
		models.CurrentConfig.EmailRecipients,
		[]byte(message))
	currentTimeData := time.Now().Format("2006-01-02 15:04:05")
	if err != nil {
		fmt.Sprintf("%s  SMTP告警邮件发送失败, 服务器：%s, 端口：%d, 发件箱：%s,收件箱：%v \n", currentTimeData, models.CurrentConfig.SMTPHost, models.CurrentConfig.SMTPPort, models.CurrentConfig.SMTPEmailAddress, models.CurrentConfig.EmailRecipients)
		fmt.Println(err)
	} else {
		fmt.Sprintf("%s  SMTP告警邮件发送成功, 服务器：%s, 端口：%d, 发件箱：%s, 收件箱：%v \n", currentTimeData, models.CurrentConfig.SMTPHost, models.CurrentConfig.SMTPPort, models.CurrentConfig.SMTPEmailAddress, models.CurrentConfig.EmailRecipients)
	}
}
