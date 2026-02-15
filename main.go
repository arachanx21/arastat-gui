package main

import (
	"net/http"
	"log"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to ARASTAT GUI!"))
	})

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe":8080", nil); err != nil {
		log.Fatal(err)
	}
}