// @anchor: leaderboard/features/settings/ui/preset-management-dialog
// @intent: Dedicated dialog for creating, editing, renaming and deleting settings presets.
import type { SettingsPreset, SettingsSnapshot } from '@/lib/types'
import { useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCarClasses, parseCarClasses } from '@/features/settings/model/serialize'
import { SettingsFormFields } from '@/features/settings/ui/SettingsFormFields'
import {
  DEFAULT_PACE_PERCENT_THRESHOLD,
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
} from '@/lib/constants'
import { useToast } from '@/shared/ui/toast'

interface PresetManagementDialogProps {
  open: boolean
  presets: SettingsPreset[]
  activePresetId: string | null
  activeSettings: SettingsSnapshot | null
  onOpenChange: (open: boolean) => void
  onCreatePreset: (settings: SettingsSnapshot, name?: string) => void
  onRenamePreset: (presetId: string, name: string) => void
  onDeletePreset: (presetId: string) => void
  onSavePreset: (presetId: string, settings: SettingsSnapshot) => void
}

const EMPTY_SETTINGS: SettingsSnapshot = {
  serverUrl: '',
  carClasses: [],
  participants: {
    csvUrl: '',
  },
  pacePercentThreshold: DEFAULT_PACE_PERCENT_THRESHOLD,
}

/**
 * Dedicated preset CRUD dialog that isolates advanced operations from quick settings.
 * @param props Dialog state and preset management callbacks.
 * @param props.open Controls visibility of the management dialog.
 * @param props.presets Full preset list available to user.
 * @param props.activePresetId Current active preset id.
 * @param props.activeSettings Current active preset snapshot.
 * @param props.onOpenChange Callback invoked on open state changes.
 * @param props.onCreatePreset Callback to create a new preset from draft.
 * @param props.onRenamePreset Callback to rename selected preset.
 * @param props.onDeletePreset Callback to delete selected preset.
 * @param props.onSavePreset Callback to persist settings into selected preset.
 * @returns Full preset management dialog with validation and delete confirmation.
 */
export function PresetManagementDialog({
  open,
  presets,
  activePresetId,
  activeSettings,
  onOpenChange,
  onCreatePreset,
  onRenamePreset,
  onDeletePreset,
  onSavePreset,
}: PresetManagementDialogProps) {
  const { success } = useToast()
  const initialSettings = activeSettings ?? EMPTY_SETTINGS
  const initialPresetName = presets.find(preset => preset.id === activePresetId)?.name ?? 'Preset'
  const [managedPresetId, setManagedPresetId] = useState<string | null>(() => activePresetId)
  const [serverUrl, setServerUrl] = useState(() => initialSettings.serverUrl)
  const [participantsCsvUrl, setParticipantsCsvUrl] = useState(() => initialSettings.participants.csvUrl)
  const [classesCsv, setClassesCsv] = useState(() => formatCarClasses(initialSettings.carClasses))
  const [pacePercentThreshold, setPacePercentThreshold] = useState(() => initialSettings.pacePercentThreshold.toString())
  const [presetName, setPresetName] = useState(() => initialPresetName)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  /**
   * Applies settings snapshot values to local draft fields used by the dialog form.
   * @param settings Snapshot source to apply into controlled inputs.
   */
  const applySnapshotToDraft = (settings: SettingsSnapshot | null) => {
    const safeSettings = settings ?? EMPTY_SETTINGS
    setServerUrl(safeSettings.serverUrl)
    setParticipantsCsvUrl(safeSettings.participants.csvUrl)
    setClassesCsv(formatCarClasses(safeSettings.carClasses))
    setPacePercentThreshold(safeSettings.pacePercentThreshold.toString())
  }

  /**
   * Resolves active preset display name from current preset list.
   */
  const managedPresetName = useMemo(() => {
    return presets.find(preset => preset.id === managedPresetId)?.name ?? 'Preset'
  }, [presets, managedPresetId])

  /**
   * Synchronizes local draft inputs with current active preset payload.
   */
  const syncDraftFromActivePreset = () => {
    applySnapshotToDraft(activeSettings)
    setManagedPresetId(activePresetId)
    setPresetName(initialPresetName)
  }

  /**
   * Mirrors dialog visibility changes to parent state and initializes draft on open.
   * @param nextOpen Next dialog visibility state.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      return
    }
    syncDraftFromActivePreset()
  }

  const serverUrlError = validateRequiredHttpUrl(serverUrl)
  const participantsCsvUrlError = validateOptionalHttpUrl(participantsCsvUrl)
  const pacePercentThresholdError = validatePacePercentThreshold(pacePercentThreshold)
  const presetNameError = validatePresetName({
    value: presetName,
    presets,
    activePresetId: managedPresetId,
    mode: 'save',
  })
  const createPresetNameError = validatePresetName({
    value: presetName,
    presets,
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
   * Selects preset for management and immediately reflects it in local draft inputs.
   * @param presetId Target preset id from selector.
   */
  const handleSelectPreset = (presetId: string) => {
    setManagedPresetId(presetId)
    const selectedPreset = presets.find(preset => preset.id === presetId)
    applySnapshotToDraft(selectedPreset?.settings ?? null)
    setPresetName(selectedPreset?.name ?? 'Preset')
  }

  /**
   * Saves current draft over the active preset and applies name change in one action.
   */
  const handleSavePreset = () => {
    if (!canPersist) {
      return
    }

    if (!managedPresetId) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv, pacePercentThreshold)
    onRenamePreset(managedPresetId, presetName)
    onSavePreset(managedPresetId, nextSnapshot)
    success('Preset saved.')
  }

  /**
   * Creates a brand-new preset from current draft and switches active preset to it.
   */
  const handleCreatePreset = () => {
    if (!canCreate) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv, pacePercentThreshold)
    onCreatePreset(nextSnapshot, presetName)
    success('Preset created.')
  }

  /**
   * Executes active preset deletion after user confirmation.
   */
  const handleDeletePreset = () => {
    const nextPresetAfterDelete = presets.find(preset => preset.id !== managedPresetId) ?? null
    if (!managedPresetId) {
      return
    }
    setDeleteDialogOpen(false)
    onDeletePreset(managedPresetId)
    setManagedPresetId(nextPresetAfterDelete?.id ?? null)
    applySnapshotToDraft(nextPresetAfterDelete?.settings ?? null)
    setPresetName(nextPresetAfterDelete?.name ?? 'Preset')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preset Management</DialogTitle>
          </DialogHeader>

          <div className="mt-4 grid gap-6">
            <div className="grid gap-2">
              <Label id="preset-select-label">Select preset to edit</Label>
              <Select value={managedPresetId ?? undefined} onValueChange={value => value && handleSelectPreset(value)}>
                <SelectTrigger aria-labelledby="preset-select-label" className="w-full">
                  <SelectValue placeholder="Select preset">
                    {managedPresetName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card size="default" className="gap-0">
              <CardContent className="grid gap-4 py-4">
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
                  disabled={presets.length <= 1 || !managedPresetId}
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
        </DialogContent>
      </Dialog>

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
              disabled={presets.length <= 1}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Validates required HTTP URL input used in preset forms.
 * @param value URL string from input.
 * @returns Validation error text or null when valid.
 */
function validateRequiredHttpUrl(value: string): string | null {
  if (!value.trim()) {
    return 'URL is required.'
  }

  return validateOptionalHttpUrl(value)
}

/**
 * Validates optional HTTP URL input used in preset forms.
 * @param value URL string from input.
 * @returns Validation error text or null when valid/empty.
 */
function validateOptionalHttpUrl(value: string): string | null {
  if (!value.trim()) {
    return null
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'URL must use http or https.'
    }
    return null
  }
  catch {
    return 'URL is invalid.'
  }
}

/**
 * Validates allowed pace threshold percentage.
 * @param value Raw input string.
 * @returns Validation error text or null.
 */
function validatePacePercentThreshold(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Threshold is required.'
  }

  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    return 'Threshold must be an integer.'
  }

  if (numeric < MIN_PACE_PERCENT_THRESHOLD || numeric > MAX_PACE_PERCENT_THRESHOLD) {
    return `Threshold must be between ${MIN_PACE_PERCENT_THRESHOLD} and ${MAX_PACE_PERCENT_THRESHOLD}.`
  }

  return null
}

interface ValidatePresetNameParams {
  value: string
  presets: SettingsPreset[]
  activePresetId?: string | null
  mode: 'create' | 'save'
}

/**
 * Validates preset name based on required and uniqueness constraints.
 * @param params Validation params.
 * @param params.value Current name input.
 * @param params.presets Existing preset list.
 * @param params.activePresetId Current active preset id.
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
 * @returns Human-readable warning hints.
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
 * Creates a normalized settings snapshot from current dialog fields.
 * @param serverUrl Draft server URL.
 * @param participantsCsvUrl Draft participants CSV URL.
 * @param classesCsv Draft car class rules text.
 * @param pacePercentThreshold Draft pace threshold in percent.
 * @returns Normalized snapshot payload for storage.
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
