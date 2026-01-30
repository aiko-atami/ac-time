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

func main() {
	urlPtr := flag.String("url", "", "URL to scrape")
	outputPtr := flag.String("output", "participants.csv", "Output CSV file path")
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

	var records [][]string
	// Header
	records = append(records, []string{"Position", "Driver", "Country", "City", "Team", "Class"})

	// Find the participants table.
	// Based on analysis, the table contains rows with class="first" for the numbering or driver name.
	// A more robust selector: find the row containing "Abubekirov Asker" and inspect its parents,
	// or iterate through all trs and look for the specific structure.
	// The grep showed: <td class="first text-end">1</td> <td class="first" data-driver-id="...">

	doc.Find("tr").Each(func(i int, s *goquery.Selection) {
		// Check if this is a participant row
		// We look for a cell with class "first" that contains a data-driver-id attribute or similar structure
		// The grep output showed:
		// <td class="first text-end">1</td>
		// <td class="first" data-driver-id="13866"><a ...>Name</a></td>

		driverCell := s.Find("td[data-driver-id]")
		if driverCell.Length() > 0 {
			pos := strings.TrimSpace(s.Find("td.first.text-end").Text())
			driver := strings.TrimSpace(driverCell.Text())

			// Geography is in the cell after driver cell, containing flag img and text (City)
			// <td class="first"><img ... title="Country"> City </td>
			geoCell := driverCell.Next()
			country := ""
			countryFlag := geoCell.Find("img.country-flag")
			if countryFlag.Length() > 0 {
				country, _ = countryFlag.Attr("title")
			}
			city := strings.TrimSpace(geoCell.Text())
			// city text might contain the country text if the img alt is text, but usually it's separate.
			// The text content of geoCell includes the city name.

			// Team is in the next td
			// <td><a ...>Team Name</a></td>
			teamCell := geoCell.Next()
			team := strings.TrimSpace(teamCell.Text())
			if team == "-" {
				team = ""
			}

			// Class/Category is in the next td
			// <td>Category</td>
			classCell := teamCell.Next()
			class := strings.TrimSpace(classCell.Text())

			records = append(records, []string{pos, driver, country, city, team, class})
		}
	})

	if len(records) <= 1 {
		log.Println("Warning: No participants found. Check selector logic.")
	} else {
		log.Printf("Found %d participants", len(records)-1)
	}

	writeCSV(*outputPtr, records)

	// Create second file with reversed names
	var ext string
	var basePath string
	if dotIndex := strings.LastIndex(*outputPtr, "."); dotIndex != -1 {
		basePath = (*outputPtr)[:dotIndex]
		ext = (*outputPtr)[dotIndex:]
	} else {
		basePath = *outputPtr
		ext = ""
	}
	outputReversePtr := basePath + "-name-reversed" + ext

	// Deep copy records to avoid modifying original if we were to reuse it (though we just write it)
	// Actually we can just traverse and create a new slice or modify on the fly?
	// Let's create a new slice for safety.
	recordsReverse := make([][]string, len(records))
	for i, rec := range records {
		newRec := make([]string, len(rec))
		copy(newRec, rec)
		if i > 0 { // Skip header
			name := newRec[1]
			parts := strings.Fields(name)
			if len(parts) >= 2 {
				// Swap first and last tokens, keep middle? OR just reverse order?
				// User said: "имя и фамилию нужно менять местами" (swap name and surname)
				// usually: First Last -> Last First.
				// If First Middle Last -> Last First Middle ?? Or Last Middle First?
				// Simple approach: Last + " " + (everything else)
				last := parts[len(parts)-1]
				rest := strings.Join(parts[:len(parts)-1], " ")
				newRec[1] = last + " " + rest
			}
		}
		recordsReverse[i] = newRec
	}

	writeCSV(outputReversePtr, recordsReverse)
}

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
