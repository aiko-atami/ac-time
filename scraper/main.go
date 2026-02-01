package main

import (
	"encoding/csv"
	"flag"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// main is the entry point of the application.
//
// Responsibilities:
//   - Parse command line arguments.
//   - Fetch and parse the HTML content from the provided URL.
//   - Extract participant data and save it to a CSV file.
//   - Generate a secondary CSV file with reversed driver names.
func main() {
	urlPtr := flag.String("url", "", "URL to scrape")
	outputPtr := flag.String("output", "participants.csv", "Output CSV file path")
	reverseNamePtr := flag.Bool("with-reverse-name", false, "Generate an additional CSV with reversed driver names")
	flag.Parse()

	if *urlPtr == "" {
		log.Fatal("URL is required. Use --url flag.")
	}

	log.Printf("Fetching URL: %s", *urlPtr)
	res, err := http.Get(*urlPtr)
	if err != nil {
		log.Fatalf("Failed to fetch URL: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		log.Fatalf("Status code error: %d %s", res.StatusCode, res.Status)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		log.Fatalf("Failed to parse HTML: %v", err)
	}

	records := extractParticipants(doc)

	if len(records) <= 1 {
		log.Println("Warning: No participants found.")
	} else {
		log.Printf("Found %d participants", len(records)-1)
	}

	writeCSV(*outputPtr, records)

	// Create second file with reversed names if requested
	if *reverseNamePtr {
		reversedRecords := generateReversedRecords(records)
		outputReversePtr := getReversedFilename(*outputPtr)

		writeCSV(outputReversePtr, reversedRecords)
	}
}

// extractParticipants parses the HTML document to find and extract participant information.
//
// Parameters:
//   - doc: A pointer to a goquery.Document representing the parsed HTML pages.
//
// Returns:
//   - A 2D slice of strings where the first row is the header and subsequent rows
//     contain participant details (Position, Driver, Country, City, Team, Class, Car).
//
// Parsing Logic:
//   - Iterates through all table rows (`tr`).
//   - Identifies participant rows by the presence of a cell with `data-driver-id`.
//   - Extracts text content from specific cells relative to the driver cell.
func extractParticipants(doc *goquery.Document) [][]string {
	var records [][]string
	// Header
	records = append(records, []string{"Position", "Driver", "Country", "City", "Team", "Class", "Car"})

	doc.Find("tr").Each(func(i int, s *goquery.Selection) {
		driverCell := s.Find("td[data-driver-id]")
		if driverCell.Length() > 0 {
			pos := strings.TrimSpace(s.Find("td.first.text-end").Text())
			driver := strings.TrimSpace(driverCell.Text())

			// Geography cell contains flag img and city text
			geoCell := driverCell.Next()
			country := ""
			countryFlag := geoCell.Find("img.country-flag")
			if countryFlag.Length() > 0 {
				country, _ = countryFlag.Attr("title")
			}
			city := strings.TrimSpace(geoCell.Text())

			// Team is in the next cell
			teamCell := geoCell.Next()
			team := strings.TrimSpace(teamCell.Text())
			if team == "-" {
				team = ""
			}

			// Class/Category is in the next cell
			classCell := teamCell.Next()
			class := strings.TrimSpace(classCell.Text())

			// Car is in the next cell
			carCell := classCell.Next()
			car := strings.TrimSpace(carCell.Text())

			records = append(records, []string{pos, driver, country, city, team, class, car})
		}
	})

	return records
}

// generateReversedRecords creates a new dataset with the Driver's name formatted as "Lastname Firstname ...".
//
// Parameters:
//   - records: The original dataset where the second column (index 1) is the Driver's name.
//
// Returns:
//   - A new 2D slice with the same data as input but with modified Driver names.
//     The header row is preserved as is.
func generateReversedRecords(records [][]string) [][]string {
	recordsReverse := make([][]string, len(records))
	for i, rec := range records {
		newRec := make([]string, len(rec))
		copy(newRec, rec)
		if i > 0 { // Skip header
			name := newRec[1]
			parts := strings.Fields(name)
			if len(parts) >= 2 {
				// Format: Lastname [rest of names]
				last := parts[len(parts)-1]
				rest := strings.Join(parts[:len(parts)-1], " ")
				newRec[1] = last + " " + rest
			}
		}
		recordsReverse[i] = newRec
	}
	return recordsReverse
}

// getReversedFilename generates the filename for the reversed names CSV.
//
// Parameters:
//   - original: The original output filename (e.g., "file.csv").
//
// Returns:
//   - A string with "-name-reversed" appended before the extension (e.g., "file-name-reversed.csv").
func getReversedFilename(original string) string {
	var ext string
	var basePath string
	if dotIndex := strings.LastIndex(original, "."); dotIndex != -1 {
		basePath = (original)[:dotIndex]
		ext = (original)[dotIndex:]
	} else {
		basePath = original
		ext = ""
	}
	return basePath + "-name-reversed" + ext
}

// writeCSV writes the provided records to a CSV file.
//
// Parameters:
//   - filename: The path to the output file.
//   - records: A 2D slice of strings to be written as CSV rows.
//
// Side Effects:
//   - Creates or overwrites the file at `filename`.
//   - Logs a fatal error and exits if file creation or writing fails.
func writeCSV(filename string, records [][]string) {
	file, err := os.Create(filename)
	if err != nil {
		log.Fatalf("Failed to create output file %s: %v", filename, err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	for _, record := range records {
		if err := writer.Write(record); err != nil {
			log.Fatalf("Error writing record to csv %s: %v", filename, err)
		}
	}

	log.Printf("Successfully wrote to %s", filename)
}
