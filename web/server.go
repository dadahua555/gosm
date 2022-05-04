package web

import (
	"crypto/rand"
	"crypto/tls"
	"fmt"
	"github.com/gorilla/mux"
	"gosm/models"
	"log"
	"net/http"
	"strconv"
	"time"
)

var (
	router *mux.Router
)

//cert.pem, key.unencrypted.pem
func inittls(cfg *tls.Config) {
	crt, err := tls.LoadX509KeyPair("./private/serverCert.pem", "./private/server-key.pem")
	if err != nil {
		log.Fatalln(err.Error())
	}

	cfg.Time = time.Now
	cfg.Rand = rand.Reader
	cfg.Certificates = []tls.Certificate{crt}

}

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
	router.HandleFunc("/ValidateLogin", validate)

	fs := http.FileServer(http.Dir("./public/"))
	router.PathPrefix("/").Handler(fs)

	currentTimeData := time.Now().Format("2006-01-02 15:04:05")
	if models.CurrentConfig.Verbose {
		fmt.Println(currentTimeData + "  " + "Starting web UI accessible at https://" + models.CurrentConfig.WebUIHost + ":" + strconv.Itoa(models.CurrentConfig.WebUIPort) + "/")
	}

	sslconfig := &tls.Config{}
	inittls(sslconfig)

	srv := &http.Server{
		Addr:         "127.0.0.1:7301",
		Handler:      router,
		TLSConfig:    sslconfig,
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler), 0),
	}

	err := srv.ListenAndServeTLS("./private/serverCert.pem", "./private/server-key.pem")
	if err != nil {
		panic(err)
	}

	/*
		err := http.ListenAndServe(models.CurrentConfig.WebUIHost+":"+strconv.Itoa(models.CurrentConfig.WebUIPort), router)
		if err != nil {
			panic(err)
		}

	*/
}
