// Visual form fields for editable preset settings snapshot values.
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

interface SettingsFormFieldsProps {
  serverUrl: string
  participantsCsvUrl: string
  classesText: string
  serverUrlError?: string
  participantsCsvUrlError?: string
  classesHints?: string[]
  onServerUrlChange: (value: string) => void
  onParticipantsCsvUrlChange: (value: string) => void
  onClassesTextChange: (value: string) => void
}

/**
 * Renders editable fields for server URL, participants CSV URL and class rules.
 * @param props Form field props.
 * @param props.serverUrl Current server URL value.
 * @param props.participantsCsvUrl Current participants CSV URL value.
 * @param props.classesText Current car classes multiline value.
 * @param props.serverUrlError Server URL validation error.
 * @param props.participantsCsvUrlError Participants URL validation error.
 * @param props.classesHints Parser warning hints.
 * @param props.onServerUrlChange Callback for server URL updates.
 * @param props.onParticipantsCsvUrlChange Callback for participants URL updates.
 * @param props.onClassesTextChange Callback for class mapping updates.
 * @returns Settings form fields block.
 */
export function SettingsFormFields({
  serverUrl,
  participantsCsvUrl,
  classesText,
  serverUrlError,
  participantsCsvUrlError,
  classesHints,
  onServerUrlChange,
  onParticipantsCsvUrlChange,
  onClassesTextChange,
}: SettingsFormFieldsProps) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-1.5">
        <Label htmlFor="server-url">
          Server URL
        </Label>
        <Input
          id="server-url"
          name="serverUrl"
          type="url"
          autoComplete="url"
          value={serverUrl}
          onChange={e => onServerUrlChange(e.target.value)}
          aria-invalid={Boolean(serverUrlError)}
          aria-describedby={serverUrlError ? 'server-url-error' : undefined}
        />
        {serverUrlError && (
          <p id="server-url-error" className="text-xs text-destructive" aria-live="polite">
            {serverUrlError}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="participants-csv-url">
          Participants CSV URL (optional)
        </Label>
        <Input
          id="participants-csv-url"
          name="participantsCsvUrl"
          type="url"
          autoComplete="url"
          value={participantsCsvUrl}
          onChange={e => onParticipantsCsvUrlChange(e.target.value)}
          aria-invalid={Boolean(participantsCsvUrlError)}
          aria-describedby={participantsCsvUrlError ? 'participants-csv-url-error' : undefined}
        />
        {participantsCsvUrlError && (
          <p id="participants-csv-url-error" className="text-xs text-destructive" aria-live="polite">
            {participantsCsvUrlError}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="classes">
          Car Classes
        </Label>
        <Textarea
          id="classes"
          name="carClasses"
          value={classesText}
          onChange={e => onClassesTextChange(e.target.value)}
          placeholder="Super Production: SUPER-PRODUCTION&#10;Lada C GT: Concept C GT, Lada CGT"
          rows={7}
          aria-describedby="car-classes-help"
        />
        <p id="car-classes-help" className="text-[0.8rem] text-muted-foreground">
          One class per line:
          {' '}
          <code>ClassName: pattern1, pattern2</code>
        </p>
        {classesHints?.map(hint => (
          <p key={hint} className="text-[0.8rem] text-amber-700" aria-live="polite">
            {hint}
          </p>
        ))}
      </div>
    </div>
  )
}
