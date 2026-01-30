import { useState, useEffect } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { CarClassRule } from '@/lib/types';

interface SettingsDialogProps {
    serverUrl: string;
    carClasses: CarClassRule[];
    onSave: (url: string, classes: CarClassRule[]) => void;
}

export function SettingsDialog({ serverUrl, carClasses, onSave }: SettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState(serverUrl);
    const [classesCsv, setClassesCsv] = useState('');

    useEffect(() => {
        if (open) {
            setUrl(serverUrl);
            // Convert current rules to multi-line format: "ClassName: pattern1, pattern2"
            const lines = carClasses.map(c => `${c.name}: ${c.patterns.join(', ')}`);
            setClassesCsv(lines.join('\n'));
        }
    }, [open, serverUrl, carClasses]);

    const handleSave = () => {
        // Parse multi-line format: "ClassName: pattern1, pattern2"
        const lines = classesCsv.split('\n').map(s => s.trim()).filter(Boolean);
        const newClasses: CarClassRule[] = lines.map(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                // No colon - treat entire line as both name and single pattern
                return { name: line, patterns: [line] };
            }
            const name = line.slice(0, colonIndex).trim();
            const patternsStr = line.slice(colonIndex + 1).trim();
            const patterns = patternsStr.split(',').map(p => p.trim()).filter(Boolean);
            // If no patterns after colon, use name as pattern
            if (patterns.length === 0) {
                return { name, patterns: [name] };
            }
            return { name, patterns };
        });

        onSave(url, newClasses);
        setOpen(false);
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title="Settings"
                aria-label="Settings"
            >
                <IconSettings className="h-5 w-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>
                            Configure the server URL and car classes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="server-url" className="text-right">
                                Server URL
                            </Label>
                            <Input
                                id="server-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="classes" className="text-right">
                                Car Classes
                            </Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="classes"
                                    value={classesCsv}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClassesCsv(e.target.value)}
                                    placeholder="Super Production: SUPER-PRODUCTION&#10;Lada C GT: Concept C GT, Lada CGT"
                                    rows={5}
                                />
                                <p className="text-[0.8rem] text-muted-foreground mt-1">
                                    One class per line: <code>ClassName: pattern1, pattern2</code>
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
