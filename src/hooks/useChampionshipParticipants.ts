import { useState, useEffect } from 'react';
import type { ProcessedEntry } from '@/lib/types';

interface Participant {
    driver: string;
    class: string;
    team?: string;
}

const CSV_URL = '/api/participants';

export function useChampionshipParticipants() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await fetch(CSV_URL);
                if (!response.ok) throw new Error('Failed to fetch participants');

                const text = await response.text();
                const lines = text.split('\n');

                // Skip header (index 0) and parse lines
                const parsed = lines.slice(1)
                    .map(line => {
                        const cols = line.split(',').map(c => c.trim());
                        if (cols.length < 6) return null;

                        // Explicitly cast to match interface if needed, or let inference work
                        const p: Participant = {
                            driver: cols[1],
                            team: cols[4] === '-' ? undefined : cols[4],
                            class: cols[5]
                        };
                        return p;
                    })
                    .filter((p): p is Participant => p !== null && !!p.driver);

                setParticipants(parsed);
            } catch (err) {
                console.error('Error loading participants:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, []);

    const isRegistered = (entry: ProcessedEntry): boolean => {
        if (!participants.length) return false;

        const entryParts = entry.driverName.toLowerCase().split(/\s+/).filter(p => p.length > 0);

        const match = participants.find(p => {
            const pParts = p.driver.toLowerCase().split(/\s+/).filter(part => part.length > 0);

            if (entryParts.length !== pParts.length) return false;

            const pSet = new Set(pParts);
            const nameMatches = entryParts.every(part => pSet.has(part));

            if (!nameMatches) return false;

            return entry.carClass.toLowerCase() === p.class.toLowerCase();
        });

        return !!match;
    };

    return { participants, loading, isRegistered };
}
