export const onRequest = async (context: any) => {
    const CSV_URL = 'https://github.com/aiko-atami/ac-time/releases/download/championship-537/participants-537.csv';

    try {
        const response = await fetch(CSV_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return new Response(`Failed to fetch CSV: ${response.statusText}`, { status: response.status });
        }

        const data = await response.text();

        return new Response(data, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
        });
    } catch (err) {
        return new Response(`Server error: ${err}`, { status: 500 });
    }
};
