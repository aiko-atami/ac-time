// Settings page for creating and editing live timing presets stored in localStorage.
import type { SettingsPreset, SettingsSnapshot } from '@/shared/types'
import { Link } from '@argon-router/react'
import { useMemo, useState } from 'react'
import {
  formatCarClasses,
  parseCarClasses,
  useSettingsPresets,
  validateOptionalHttpUrl,
  validatePacePercentThreshold,
  validateRequiredHttpUrl,
} from '@/features/settings-presets'
import {
  DEFAULT_PACE_PERCENT_THRESHOLD,
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
} from '@/shared/config/constants'
import { routes } from '@/shared/routing'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { buttonVariants } from '@/shared/ui/button-variants'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useToast } from '@/shared/ui/toast'
import { SettingsFormFields } from './SettingsFormFields'

const EMPTY_SETTINGS: SettingsSnapshot = {
  serverUrl: '',
  carClasses: [],
  participants: {
    csvUrl: '',
  },
  pacePercentThreshold: DEFAULT_PACE_PERCENT_THRESHOLD,
}

/**
 * Renders settings page with full preset management form.
 * @returns Settings page.
 */
export function SettingsPage() {
  const { success } = useToast()
  const presets = useSettingsPresets()
  const activeSettings = presets.activePreset?.settings ?? null
  const initialSettings = activeSettings ?? EMPTY_SETTINGS
  const initialPresetName = presets.activePreset?.name ?? 'Preset'

  const [managedPresetId, setManagedPresetId] = useState<string | null>(() => presets.activePresetId)
  const [serverUrl, setServerUrl] = useState(() => initialSettings.serverUrl)
  const [participantsCsvUrl, setParticipantsCsvUrl] = useState(() => initialSettings.participants.csvUrl)
  const [classesCsv, setClassesCsv] = useState(() => formatCarClasses(initialSettings.carClasses))
  const [pacePercentThreshold, setPacePercentThreshold] = useState(() => initialSettings.pacePercentThreshold.toString())
  const [presetName, setPresetName] = useState(() => initialPresetName)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const serverUrlError = validateRequiredHttpUrl(serverUrl)
  const participantsCsvUrlError = validateOptionalHttpUrl(participantsCsvUrl)
  const pacePercentThresholdError = validatePacePercentThreshold(pacePercentThreshold)
  const presetNameError = validatePresetName({
    value: presetName,
    presets: presets.presets,
    activePresetId: managedPresetId,
    mode: 'save',
  })
  const createPresetNameError = validatePresetName({
    value: presetName,
    presets: presets.presets,
    mode: 'create',
  })
  const classesHints = buildCarClassesHints(classesCsv)

  const canPersist = Boolean(managedPresetId)
    && !serverUrlError
    && !participantsCsvUrlError
    && !pacePercentThresholdError
    && !presetNameError
  const canCreate = !serverUrlError
    && !participantsCsvUrlError
    && !pacePercentThresholdError
    && !createPresetNameError

  /**
   * Resolves active preset display name from current list.
   * @returns Selected preset label.
   */
  const managedPresetName = useMemo(() => {
    return presets.presets.find(preset => preset.id === managedPresetId)?.name ?? 'Preset'
  }, [presets.presets, managedPresetId])

  /**
   * Applies settings snapshot values into local draft form controls.
   * @param settings Snapshot source.
   */
  const applySnapshotToDraft = (settings: SettingsSnapshot | null) => {
    const safeSettings = settings ?? EMPTY_SETTINGS
    setServerUrl(safeSettings.serverUrl)
    setParticipantsCsvUrl(safeSettings.participants.csvUrl)
    setClassesCsv(formatCarClasses(safeSettings.carClasses))
    setPacePercentThreshold(safeSettings.pacePercentThreshold.toString())
  }

  /**
   * Selects preset for editing and loads it into draft state.
   * @param presetId Target preset id.
   */
  const handleSelectPreset = (presetId: string) => {
    setManagedPresetId(presetId)
    const selectedPreset = presets.presets.find(preset => preset.id === presetId)
    applySnapshotToDraft(selectedPreset?.settings ?? null)
    setPresetName(selectedPreset?.name ?? 'Preset')
  }

  /**
   * Saves current draft into selected preset.
   */
  const handleSavePreset = () => {
    if (!canPersist || !managedPresetId) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv, pacePercentThreshold)
    presets.renamePresetById(managedPresetId, presetName)
    presets.savePresetSettingsById(managedPresetId, nextSnapshot)
    presets.selectPreset(managedPresetId)
    success('Preset saved.')
  }

  /**
   * Creates a new preset from current draft.
   */
  const handleCreatePreset = () => {
    if (!canCreate) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv, pacePercentThreshold)
    presets.createNewPreset(nextSnapshot, presetName)
    success('Preset created.')
  }

  /**
   * Deletes current preset and focuses next available preset.
   */
  const handleDeletePreset = () => {
    if (!managedPresetId) {
      return
    }

    const nextPresetAfterDelete = presets.presets.find(preset => preset.id !== managedPresetId) ?? null
    setDeleteDialogOpen(false)
    presets.deletePresetById(managedPresetId)
    setManagedPresetId(nextPresetAfterDelete?.id ?? null)
    applySnapshotToDraft(nextPresetAfterDelete?.settings ?? null)
    setPresetName(nextPresetAfterDelete?.name ?? 'Preset')
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-3 py-4 sm:py-5 max-w-4xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage live timing presets saved in local storage.</p>
          </div>
          <Link to={routes.liveTiming} className={buttonVariants({ variant: 'outline' })}>
            Back to Live Timing
          </Link>
        </header>

        <Card size="default" className="gap-0">
          <CardHeader>
            <CardTitle>Preset Management</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label id="preset-select-label">Select preset to edit</Label>
              <Select value={managedPresetId ?? undefined} onValueChange={value => value && handleSelectPreset(value)}>
                <SelectTrigger aria-labelledby="preset-select-label" className="w-full">
                  <SelectValue placeholder="Select preset">
                    {managedPresetName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {presets.presets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                name="presetName"
                autoComplete="off"
                value={presetName}
                onChange={event => setPresetName(event.target.value)}
                placeholder="Preset name"
                aria-invalid={Boolean(presetNameError)}
                aria-describedby={presetNameError ? 'preset-name-error' : undefined}
              />
              {presetNameError && (
                <p id="preset-name-error" className="text-xs text-destructive" aria-live="polite">
                  {presetNameError}
                </p>
              )}
            </div>

            <SettingsFormFields
              serverUrl={serverUrl}
              participantsCsvUrl={participantsCsvUrl}
              classesText={classesCsv}
              serverUrlError={serverUrlError ?? undefined}
              participantsCsvUrlError={participantsCsvUrlError ?? undefined}
              pacePercentThreshold={pacePercentThreshold}
              pacePercentThresholdError={pacePercentThresholdError ?? undefined}
              pacePercentThresholdMin={MIN_PACE_PERCENT_THRESHOLD}
              pacePercentThresholdMax={MAX_PACE_PERCENT_THRESHOLD}
              classesHints={classesHints}
              onServerUrlChange={setServerUrl}
              onParticipantsCsvUrlChange={setParticipantsCsvUrl}
              onClassesTextChange={setClassesCsv}
              onPacePercentThresholdChange={setPacePercentThreshold}
            />
          </CardContent>
          <CardFooter className="justify-between gap-2 border-t-0 bg-transparent pt-0">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={presets.presets.length <= 1 || !managedPresetId}
            >
              Delete Preset
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleSavePreset} disabled={!canPersist}>
                Save Preset
              </Button>
              <Button type="button" onClick={handleCreatePreset} disabled={!canCreate}>
                Create New
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Preset "
              {managedPresetName}
              " will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeletePreset}
              disabled={presets.presets.length <= 1}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface ValidatePresetNameParams {
  value: string
  presets: SettingsPreset[]
  activePresetId?: string | null
  mode: 'create' | 'save'
}

/**
 * Validates preset name required and uniqueness constraints.
 * @param params Validation params.
 * @param params.value Current name input.
 * @param params.presets Existing presets list.
 * @param params.activePresetId Selected preset id in save mode.
 * @param params.mode Validation context.
 * @returns Error text or null.
 */
function validatePresetName({
  value,
  presets,
  activePresetId,
  mode,
}: ValidatePresetNameParams): string | null {
  const normalized = value.trim()
  if (!normalized) {
    return 'Preset name is required.'
  }

  const normalizedLower = normalized.toLowerCase()
  const duplicate = presets.find((preset) => {
    if (mode === 'save' && preset.id === activePresetId) {
      return false
    }
    return preset.name.trim().toLowerCase() === normalizedLower
  })

  if (duplicate) {
    return 'Preset name must be unique.'
  }

  return null
}

/**
 * Builds warning hints for class definitions entered as free-form text.
 * @param classesCsv Current textarea value.
 * @returns Warning hints.
 */
function buildCarClassesHints(classesCsv: string): string[] {
  const hints: string[] = []
  const lines = classesCsv
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const seenNames = new Set<string>()
  let duplicateNames = 0
  let missingColon = 0
  let emptyPatternDefinitions = 0

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      missingColon += 1
      continue
    }

    const name = line.slice(0, colonIndex).trim()
    if (!name) {
      emptyPatternDefinitions += 1
      continue
    }

    const key = name.toLowerCase()
    if (seenNames.has(key)) {
      duplicateNames += 1
    }
    seenNames.add(key)

    const patterns = line
      .slice(colonIndex + 1)
      .split(',')
      .map(pattern => pattern.trim())
      .filter(Boolean)

    if (patterns.length === 0) {
      emptyPatternDefinitions += 1
    }
  }

  if (missingColon > 0) {
    hints.push(`Warning: ${missingColon} line(s) miss ":" and will fallback to "ClassName: ClassName".`)
  }
  if (duplicateNames > 0) {
    hints.push(`Warning: ${duplicateNames} duplicate class name(s) will be ignored on save.`)
  }
  if (emptyPatternDefinitions > 0) {
    hints.push(`Warning: ${emptyPatternDefinitions} line(s) have no patterns and will fallback to class name.`)
  }

  return hints
}

/**
 * Creates a normalized settings snapshot from current draft fields.
 * @param serverUrl Draft server URL.
 * @param participantsCsvUrl Draft participants CSV URL.
 * @param classesCsv Draft car class rules text.
 * @param pacePercentThreshold Draft pace threshold.
 * @returns Normalized snapshot for storage.
 */
function buildDraftSnapshot(
  serverUrl: string,
  participantsCsvUrl: string,
  classesCsv: string,
  pacePercentThreshold: string,
): SettingsSnapshot {
  return {
    serverUrl: serverUrl.trim(),
    participants: {
      csvUrl: participantsCsvUrl.trim(),
    },
    carClasses: parseCarClasses(classesCsv),
    pacePercentThreshold: Number.parseInt(pacePercentThreshold, 10),
  }
}
