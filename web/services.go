package web

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"gosm/alerts"
	"gosm/models"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func services(writer http.ResponseWriter, request *http.Request) {
	fmt.Println("wocao")
	var payload []byte

	switch request.Method {
	case "GET":
		payload, _ = json.Marshal(models.CurrentServices)
	case "POST":
		request.ParseForm()
		port := "NULL"
		if request.FormValue("port") != "" {
			port = "'" + request.FormValue("port") + "'"
		}
		if request.FormValue("name") == "" || request.FormValue("protocol") == "" || request.FormValue("host") == "" || request.FormValue("grp") == "" || request.FormValue("emails") == "" {
			payload = []byte("{\"success\":false}")
		} else {
			models.Database.MustExec("INSERT INTO services (name, protocol, host, port, grp, emails) VALUES('" + request.FormValue("name") + "', '" + request.FormValue("protocol") + "', '" + request.FormValue("host") + "', " + port + ",'" + request.FormValue("grp") + "','" + request.FormValue("emails") + "')")
			models.LoadServices()
			payload = []byte("{\"success\":true}")
		}
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

func batchadd(writer http.ResponseWriter, request *http.Request) {
	var payload []byte

	switch request.Method {
	case "POST":
		request.ParseForm()
		port := "NULL"
		if request.FormValue("port") != "" {
			port = "'" + request.FormValue("port") + "'"
		}
		//fmt.Println("service add: ",request.FormValue("name"))
		if request.FormValue("name") == "" || request.FormValue("protocol") == "" || request.FormValue("host") == "" || request.FormValue("grp") == "" || request.FormValue("emails") == "" {
			payload = []byte("{\"success\":false}")
		} else {
			models.Database.MustExec("INSERT INTO services (name, protocol, host, port, grp, emails) VALUES('" + request.FormValue("name") + "', '" + request.FormValue("protocol") + "', '" + request.FormValue("host") + "', " + port + ",'" + request.FormValue("grp") + "','" + request.FormValue("emails") + "')")
			models.LoadServices()
			payload = []byte("{\"success\":true}")
		}
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

func service(writer http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)

	var payload []byte
	switch request.Method {
	case "GET":
		var service models.Service
		models.Database.Get(&service, "SELECT * FROM services WHERE id='"+vars["serviceID"]+"'")
		payload, _ = json.Marshal(service)
	case "PUT":
		request.ParseForm()
		port := "NULL"
		if request.FormValue("port") != "" {
			port = "'" + request.FormValue("port") + "'"
		}
		models.Database.MustExec("UPDATE services SET name='" + request.FormValue("name") + "', protocol='" + request.FormValue("protocol") + "', host='" + request.FormValue("host") + "', port=" + port + ",grp='" + request.FormValue("grp") + "',emails='" + request.FormValue("emails") + "' WHERE id='" + vars["serviceID"] + "'")
		models.LoadServices()
		payload = []byte("{\"success\":true}")
	case "DELETE":
		request.ParseForm()
		input_password := request.Form.Get("input_password")
		config_password := models.CurrentConfig.ConfigPassword

		if config_password == input_password {
			models.Database.MustExec("DELETE FROM services WHERE id='" + vars["serviceID"] + "'")
			models.LoadServices()
			payload = []byte("{\"success\":true}")
		} else {
			payload = []byte("{\"success\":false}")
		}
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

func check(writer http.ResponseWriter, request *http.Request) {
	var payload []byte
	var service models.Service = models.Service{Name: "", Protocol: "", Host: "", Status: "false"}
	switch request.Method {
	case "POST":
		defer request.Body.Close()
		con, _ := ioutil.ReadAll(request.Body)
		err := json.Unmarshal(con, &service)
		if err != nil {
			fmt.Println(err)
		}
		status := false
		switch service.Protocol {
		case "icmp", "ICMP", "http", "HTTP", "https", "HTTPS":
			if service.Host != "" {
				status = service.CheckService()
			}
		case "tcp", "TCP":
			if service.Host != "" {
				status = service.CheckService()
			}
		default:
			//fmt.Println("protocol error")
			service.Status = "protocol error"
		}
		if status == true {
			service.Status = "true"
		}
		payload, err = service.MarshalJSON2()
		if err != nil {
			fmt.Println("generate json []byte error")
		}
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

func smtptest(writer http.ResponseWriter, request *http.Request) {
	var payload []byte
	payload = []byte("{\"success\":true}")
	switch request.Method {
	case "POST":
		go alerts.SendSMTPTest()
	default:
		go alerts.SendSMTPTest()
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

func checklog(writer http.ResponseWriter, request *http.Request) {
	query := request.URL.Query()

	var payload []byte
	var checklogs []models.CheckLog
	switch request.Method {
	case "GET":
		serviceID := query.Get("serviceID")
		startTimeStr := query.Get("startTime")
		endTimeStr := query.Get("endTime")
		if startTimeStr == "" {
			startTime := time.Now().Unix() - 2*60*60
			startTimeStr = time.Unix(startTime, 0).Format("2006-01-02 15:04:05")
		}
		if endTimeStr == "" {
			endTime := time.Now().Unix()
			endTimeStr = time.Unix(endTime, 0).Format("2006-01-02 15:04:05")
		}

		sqlstr := "SELECT id,logtime,status FROM checklog WHERE id='" + serviceID + "' and logtime between '" + startTimeStr + "' and '" + endTimeStr + "' order by logtime"
		models.Database.Select(&checklogs, sqlstr)
		payload, _ = json.Marshal(checklogs)
	}

	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

func change(writer http.ResponseWriter, request *http.Request) {
	query := request.URL.Query()

	var payload []byte
	switch request.Method {
	case "GET":
		serviceID := query.Get("serviceID")
		enabled := query.Get("enabled")
		models.Database.MustExec("UPDATE services SET enabled='" + enabled + "' WHERE id='" + serviceID + "'")
		models.LoadServices()
		if enabled == "1" {
			ID, _ := strconv.Atoi(serviceID)
			for i := range models.CurrentServices {
				if models.CurrentServices[i].ID == ID {
					models.CurrentServices[i].Status = models.Online
					models.CurrentServices[i].UptimeStart = time.Now().Unix()
					models.CurrentServices[i].FailtimeStart = time.Now().Unix()
					models.CurrentServices[i].FailureCount = 0
				}
			}
		}
		payload = []byte("{\"success\":true}")
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

//新加代码,验证
func userAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		//userName := strings.Trim(r.)
		//如果是用户登录，跳过验证
		url := r.RequestURI
		i := strings.Index(url, "userLogin")
		if i != -1 {
			next.ServeHTTP(w, r)
			return
		}

		var payload []byte

		token := r.Header.Get("Auth-token")
		fmt.Println(r.RequestURI)
		fmt.Println("sdfd" + token)
		err := models.RestoreToken(token)
		if err != nil {
			payload, _ = json.Marshal(map[string]interface{}{
				"success": false,
				"auth":    false,
			})
			w.Header().Set("Content-Type", "application/json")
			w.Write(payload)
		} else {
			fmt.Println("dddd")
			next.ServeHTTP(w, r)
		}
	})
}

//新加代码,登录
func login(writer http.ResponseWriter, request *http.Request) {
	fmt.Println("dasdfa")
	query := request.URL.Query()

	var payload []byte
	loginUser := query.Get("user")
	loginPassword := query.Get("password")
	fmt.Println(loginUser + loginPassword)

	if loginUser != models.CurrentConfig.UserName || loginPassword != models.CurrentConfig.UserPassword {
		payload, _ = json.Marshal(map[string]interface{}{
			"success": false,
			"token":   "",
		})
	} else {
		token, err := models.GenerateToken(loginUser)
		if err != nil {
			fmt.Printf("生成jwt失败: %s\n", err)
			payload = []byte("{\"success\":false}")
		}

		payload, _ = json.Marshal(map[string]interface{}{
			"success": true,
			"token":   token,
		})
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}

//新加代码，创建用户
func createUser(writer http.ResponseWriter, request *http.Request) {
	query := request.URL.Query()

	var payload []byte
	loginUser := query.Get("user")
	loginPassword := query.Get("password")

	result, _ := models.Database.MustExec("SELECT count(*) from admin").RowsAffected()

	if loginUser == "" || loginPassword == "" {
		payload = []byte("{\"success\":false}")
	} else if result != 0 {
		payload = []byte("{\"success\":false}")
	} else {
		models.Database.MustExec("INSERT into admin values ('" + loginUser + "', '" + loginPassword + "')")
		payload = []byte("{\"success\":true}")
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.Write(payload)
}
