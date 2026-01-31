# Yoklmn Racing Championship Scraper

This tool scrapes participant data from the Yoklmn Racing website and saves it to CSV format.

## Functionality

- Scrapes driver information including position, name, country, city, team, class, and car.
- Cleans data (e.g., removes placeholders like "-").
- **Double Output**: Generates two CSV files:
  1. The standard `participants.csv` (or specified name).
  2. A second file `participants-name-reversed.csv` where the driver's first and last names are swapped (e.g., "John Doe" becomes "Doe John").

## Usage

You can run the scraper from the command line:

```bash
./scraper --url "https://yoklmnracing.ru/championships/537" --output "participants.csv"
```

### Arguments

- `--url`: The URL of the championship page to scrape (required).
- `--output`: The path for the output CSV file (default: `participants.csv`). The second file will be automatically generated with `-name-reversed` suffix.

## Example

Running:
```bash
./scraper --url "https://yoklmnracing.ru/championships/537" --output "data/drivers.csv"
```

Will create:
1. `data/drivers.csv`
2. `data/drivers-name-reversed.csv`
