# Makefile for building and running the Go application

# Define variables
APP_NAME=myapp
GO=go

# Build the application
build:
	$(GO) build -o $(APP_NAME) main.go

# Run the application
run:
	./$(APP_NAME)

# Clean up build artifacts
clean:
	rm -f $(APP_NAME)