package web

import (
	"fmt"
	"github.com/gorilla/mux"
	"gosm/models"
	"net/http"
	"strconv"
	"time"
)

var (
	router *mux.Router
)

// Start Starts the webserver
func Start() {
	router = mux.NewRouter().StrictSlash(true)

	router.Use(userAuth)

	router.HandleFunc("/services", services)
	router.HandleFunc("/batchadd", batchadd)
	router.HandleFunc("/services/{serviceID}", service)
	router.HandleFunc("/check", check)
	router.HandleFunc("/smtptest", smtptest)
	router.HandleFunc("/checklog", checklog)
	router.HandleFunc("/change", change)
	router.HandleFunc("/userLogin", login)
	//router.HandleFunc("/ValidateLogin", validate)

	fs := http.FileServer(http.Dir("./public/"))
	router.PathPrefix("/").Handler(fs)

	currentTimeData := time.Now().Format("2006-01-02 15:04:05")
	if models.CurrentConfig.Verbose {
		fmt.Println(currentTimeData + "  " + "Starting web UI accessible at http://" + models.CurrentConfig.WebUIHost + ":" + strconv.Itoa(models.CurrentConfig.WebUIPort) + "/")
	}
	err := http.ListenAndServe(models.CurrentConfig.WebUIHost+":"+strconv.Itoa(models.CurrentConfig.WebUIPort), router)
	if err != nil {
		panic(err)
	}
}
