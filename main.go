package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"gosm/checker"
	"gosm/models"
	"gosm/web"
)

const (
	version = 1.02
)

var (
	checkChannel      = make(chan *models.Service)
	checkCountChannel chan (bool)
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "version" {
		fmt.Printf("%.2f\n", version)
		return
	}
	fixSIGTERM()
	models.CurrentConfig = models.ParseConfigFile()
	models.Connect()
	models.LoadServices()
	go web.Start()
	checker.Start()
}

func fixSIGTERM() {
	// Workaround for SIGTERM not working when pinging
	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		os.Exit(1)
	}()
}
