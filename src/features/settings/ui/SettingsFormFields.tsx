// @anchor: leaderboard/features/settings/ui/settings-form-fields
// @intent: Visual form fields for editable settings snapshot values.
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SettingsFormFieldsProps {
  serverUrl: string
  participantsCsvUrl: string
  classesText: string
  serverUrlError?: string
  participantsCsvUrlError?: string
  onServerUrlChange: (value: string) => void
  onParticipantsCsvUrlChange: (value: string) => void
  onClassesTextChange: (value: string) => void
}

/**
 * Renders editable fields for server URL, participants CSV URL and class rules.
 * @param props Form field props.
 * @returns Settings form fields block.
 */
export function SettingsFormFields({
  serverUrl,
  participantsCsvUrl,
  classesText,
  serverUrlError,
  participantsCsvUrlError,
  onServerUrlChange,
  onParticipantsCsvUrlChange,
  onClassesTextChange,
}: SettingsFormFieldsProps) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="server-url" className="text-right">
          Server URL
        </Label>
        <div className="col-span-3 grid gap-1">
          <Input
            id="server-url"
            value={serverUrl}
            onChange={e => onServerUrlChange(e.target.value)}
            aria-invalid={Boolean(serverUrlError)}
          />
          {serverUrlError && (
            <p className="text-xs text-destructive">{serverUrlError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="participants-csv-url" className="text-right">
          Participants CSV URL
        </Label>
        <div className="col-span-3 grid gap-1">
          <Input
            id="participants-csv-url"
            value={participantsCsvUrl}
            onChange={e => onParticipantsCsvUrlChange(e.target.value)}
            aria-invalid={Boolean(participantsCsvUrlError)}
          />
          {participantsCsvUrlError && (
            <p className="text-xs text-destructive">{participantsCsvUrlError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="classes" className="text-right">
          Car Classes
        </Label>
        <div className="col-span-3">
          <Textarea
            id="classes"
            value={classesText}
            onChange={e => onClassesTextChange(e.target.value)}
            placeholder="Super Production: SUPER-PRODUCTION&#10;Lada C GT: Concept C GT, Lada CGT"
            rows={7}
          />
          <p className="mt-1 text-[0.8rem] text-muted-foreground">
            One class per line:
            {' '}
            <code>ClassName: pattern1, pattern2</code>
          </p>
        </div>
      </div>
    </div>
  )
}
