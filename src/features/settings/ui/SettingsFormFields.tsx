// @anchor: leaderboard/features/settings/ui/settings-form-fields
// @intent: Visual form fields for editable settings snapshot values.
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SettingsFormFieldsProps {
  serverUrl: string
  participantsCsvUrl: string
  classesText: string
  pacePercentThreshold: string
  pacePercentThresholdMin: number
  pacePercentThresholdMax: number
  serverUrlError?: string
  participantsCsvUrlError?: string
  pacePercentThresholdError?: string
  classesHints?: string[]
  onServerUrlChange: (value: string) => void
  onParticipantsCsvUrlChange: (value: string) => void
  onClassesTextChange: (value: string) => void
  onPacePercentThresholdChange: (value: string) => void
}

/**
 * Renders editable fields for server URL, participants CSV URL and class rules.
 * @param props Form field props.
 * @param props.serverUrl Current server URL input value.
 * @param props.participantsCsvUrl Current participants CSV URL input value.
 * @param props.classesText Current multiline car classes input value.
 * @param props.pacePercentThreshold Current pace threshold input value.
 * @param props.pacePercentThresholdMin Minimal accepted threshold value.
 * @param props.pacePercentThresholdMax Maximal accepted threshold value.
 * @param props.serverUrlError Optional validation error text for server URL field.
 * @param props.participantsCsvUrlError Optional validation error text for participants CSV URL field.
 * @param props.pacePercentThresholdError Optional validation error text for threshold field.
 * @param props.classesHints Optional warning hints for car class parser behavior.
 * @param props.onServerUrlChange Callback invoked on server URL input change.
 * @param props.onParticipantsCsvUrlChange Callback invoked on participants CSV URL input change.
 * @param props.onClassesTextChange Callback invoked on car classes textarea change.
 * @param props.onPacePercentThresholdChange Callback invoked on threshold input change.
 * @returns Settings form fields block.
 */
export function SettingsFormFields({
  serverUrl,
  participantsCsvUrl,
  classesText,
  pacePercentThreshold,
  pacePercentThresholdMin,
  pacePercentThresholdMax,
  serverUrlError,
  participantsCsvUrlError,
  pacePercentThresholdError,
  classesHints,
  onServerUrlChange,
  onParticipantsCsvUrlChange,
  onClassesTextChange,
  onPacePercentThresholdChange,
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
        <Label htmlFor="pace-percent-threshold">
          Pace Threshold (%)
        </Label>
        <Input
          id="pace-percent-threshold"
          name="pacePercentThreshold"
          type="number"
          inputMode="numeric"
          min={pacePercentThresholdMin}
          max={pacePercentThresholdMax}
          step={1}
          value={pacePercentThreshold}
          onChange={e => onPacePercentThresholdChange(e.target.value)}
          aria-invalid={Boolean(pacePercentThresholdError)}
          aria-describedby={pacePercentThresholdError ? 'pace-percent-threshold-error' : 'pace-percent-threshold-help'}
        />
        <p id="pace-percent-threshold-help" className="text-[0.8rem] text-muted-foreground">
          Highlights drivers above this percentage of the fastest lap.
        </p>
        {pacePercentThresholdError && (
          <p id="pace-percent-threshold-error" className="text-xs text-destructive" aria-live="polite">
            {pacePercentThresholdError}
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
