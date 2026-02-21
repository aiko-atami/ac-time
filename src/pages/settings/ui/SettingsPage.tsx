// Settings page with active preset selection, global threshold and presets list management.

import { Link } from '@argon-router/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  formatCarClasses,
  parseCarClasses,
  useSettingsPresets,
  validateOptionalHttpUrl,
  validateRequiredHttpUrl,
} from '@/features/settings-presets'
import { useSettingsThreshold } from '@/features/settings-threshold'
import {
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
} from '@/shared/config/constants'
import { routes } from '@/shared/routing'
import type {
  PresetRef,
  ResolvedPreset,
  SettingsPreset,
  SettingsSnapshot,
} from '@/shared/types'
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
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { SettingsFormFields } from './SettingsFormFields'

const EMPTY_SETTINGS: SettingsSnapshot = {
  serverUrl: '',
  carClasses: [],
  participantsCsvUrl: '',
}

type PresetDialogMode = 'create' | 'edit'

interface PresetDraft {
  name: string
  serverUrl: string
  participantsCsvUrl: string
  classesCsv: string
}

/**
 * Renders settings page with presets list and global threshold controls.
 * @returns Settings page component.
 */
export function SettingsPage() {
  const { error, info, success } = useToast()
  const presets = useSettingsPresets()
  const threshold = useSettingsThreshold()
  const lastSyncToastStatusRef = useRef<string | null>(null)

  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [presetDialogMode, setPresetDialogMode] =
    useState<PresetDialogMode>('edit')
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [deletePresetId, setDeletePresetId] = useState<string | null>(null)
  const [presetDraft, setPresetDraft] = useState<PresetDraft>(() => {
    const activeSettings = presets.activePreset?.settings ?? EMPTY_SETTINGS
    return {
      name: presets.activePreset?.name ?? 'Preset',
      serverUrl: activeSettings.serverUrl,
      participantsCsvUrl: activeSettings.participantsCsvUrl,
      classesCsv: formatCarClasses(activeSettings.carClasses),
    }
  })

  const serverUrlError = validateRequiredHttpUrl(presetDraft.serverUrl)
  const participantsCsvUrlError = validateOptionalHttpUrl(
    presetDraft.participantsCsvUrl,
  )
  const presetNameError = validatePresetName({
    value: presetDraft.name,
    presets: presets.userPresets,
    mode: presetDialogMode,
    editedPresetId: editingPresetId,
  })
  const classesHints = buildCarClassesHints(presetDraft.classesCsv)

  const canSavePreset =
    !serverUrlError &&
    !participantsCsvUrlError &&
    !presetNameError &&
    (presetDialogMode === 'create' || Boolean(editingPresetId))

  /**
   * Opens create preset dialog using active preset settings as a starting point.
   */
  const openCreateDialog = () => {
    const sourceSettings = presets.activePreset?.settings ?? EMPTY_SETTINGS
    setPresetDialogMode('create')
    setEditingPresetId(null)
    setPresetDraft({
      name: buildNewPresetName(presets.userPresets),
      serverUrl: sourceSettings.serverUrl,
      participantsCsvUrl: sourceSettings.participantsCsvUrl,
      classesCsv: formatCarClasses(sourceSettings.carClasses),
    })
    setPresetDialogOpen(true)
  }

  /**
   * Opens edit dialog for a specific preset.
   * @param preset Preset to edit.
   */
  const openEditDialog = (preset: SettingsPreset) => {
    setPresetDialogMode('edit')
    setEditingPresetId(preset.id)
    setPresetDraft({
      name: preset.name,
      serverUrl: preset.settings.serverUrl,
      participantsCsvUrl: preset.settings.participantsCsvUrl,
      classesCsv: formatCarClasses(preset.settings.carClasses),
    })
    setPresetDialogOpen(true)
  }

  /**
   * Persists current dialog draft into create/edit operation.
   */
  const handleSavePreset = () => {
    if (!canSavePreset) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(
      presetDraft.serverUrl,
      presetDraft.participantsCsvUrl,
      presetDraft.classesCsv,
    )

    if (presetDialogMode === 'create') {
      presets.createNewPreset(nextSnapshot, presetDraft.name)
      success('Preset created.')
    } else if (editingPresetId) {
      presets.updatePresetById(editingPresetId, nextSnapshot, presetDraft.name)
      success('Preset saved.')
    }

    setPresetDialogOpen(false)
  }

  /**
   * Executes delete for the selected preset id.
   */
  const handleDeletePreset = () => {
    if (!deletePresetId) {
      return
    }

    presets.deletePresetById(deletePresetId)
    setDeletePresetId(null)
    success('Preset deleted.')
  }

  /**
   * Runs clone operation for the target preset.
   * @param presetId Preset id to clone.
   */
  const handleClonePreset = (presetId: string) => {
    presets.clonePresetByRef({ source: 'user', id: presetId })
    success('Preset cloned.')
  }

  /**
   * Resolves selected preset name for delete confirmation.
   * @returns Selected preset name.
   */
  const deletePresetName = useMemo(() => {
    if (!deletePresetId) {
      return ''
    }
    return (
      presets.userPresets.find((preset) => preset.id === deletePresetId)
        ?.name ?? ''
    )
  }, [deletePresetId, presets.userPresets])
  const activePresetName = useMemo(() => {
    return (
      presets.presetItems.find((item) =>
        presetRefEquals(item.ref, presets.activePresetRef),
      )?.preset.name ?? 'Select preset'
    )
  }, [presets.activePresetRef, presets.presetItems])

  useEffect(() => {
    const syncStatus = presets.officialSyncStatus
    if (syncStatus === lastSyncToastStatusRef.current) {
      return
    }

    if (syncStatus === 'fallback') {
      info('Official presets update failed. Using cached official presets.')
      lastSyncToastStatusRef.current = syncStatus
      return
    }

    if (syncStatus === 'error') {
      error('Official presets are temporarily unavailable.')
      lastSyncToastStatusRef.current = syncStatus
      return
    }

    lastSyncToastStatusRef.current = null
  }, [presets.officialSyncStatus, error, info])

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-3 py-4 sm:py-5 max-w-4xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
          </div>
          <Link
            to={routes.liveTiming}
            className={buttonVariants({ variant: 'outline' })}
          >
            Back
          </Link>
        </header>

        <div className="grid gap-4">
          <Card size="default" className="gap-0">
            <CardHeader>
              <CardTitle>Main options</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label id="preset-select-label">Select active preset</Label>
                <Select
                  value={
                    serializePresetRef(presets.activePresetRef) ?? undefined
                  }
                  onValueChange={(value) => {
                    const presetRef = parsePresetRef(value)
                    if (presetRef) {
                      presets.selectPreset(presetRef)
                    }
                  }}
                >
                  <SelectTrigger
                    aria-labelledby="preset-select-label"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select preset">
                      {activePresetName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Official</SelectLabel>
                      {presets.presetGroups.official.map((item) => (
                        <SelectItem
                          key={serializePresetRef(item.ref)!}
                          value={serializePresetRef(item.ref)!}
                        >
                          {item.preset.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Your presets</SelectLabel>
                      {presets.presetGroups.user.map((item) => (
                        <SelectItem
                          key={serializePresetRef(item.ref)!}
                          value={serializePresetRef(item.ref)!}
                        >
                          {item.preset.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pace-percent-threshold">Threshold (%)</Label>
                <Input
                  id="pace-percent-threshold"
                  name="pacePercentThreshold"
                  type="number"
                  inputMode="numeric"
                  min={MIN_PACE_PERCENT_THRESHOLD}
                  max={MAX_PACE_PERCENT_THRESHOLD}
                  step={1}
                  value={threshold.pacePercentThresholdInput}
                  onChange={(event) =>
                    threshold.setPacePercentThresholdInput(event.target.value)
                  }
                  onBlur={threshold.commitPacePercentThreshold}
                  aria-invalid={Boolean(threshold.pacePercentThresholdError)}
                  aria-describedby={
                    threshold.pacePercentThresholdError
                      ? 'pace-percent-threshold-error'
                      : 'pace-percent-threshold-help'
                  }
                />
                {threshold.pacePercentThresholdError && (
                  <p
                    id="pace-percent-threshold-error"
                    className="text-xs text-destructive"
                    aria-live="polite"
                  >
                    {threshold.pacePercentThresholdError}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card size="default" className="gap-0">
            <CardHeader>
              <CardTitle>Presets management</CardTitle>
              <CardAction>
                <Button type="button" size="sm" onClick={openCreateDialog}>
                  Add Preset
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-2 py-4">
              {presets.presetGroups.user.map((item) => (
                <PresetRow
                  key={serializePresetRef(item.ref)!}
                  item={item}
                  canDelete={presets.userPresets.length > 1}
                  onEdit={() => openEditDialog(item.preset)}
                  onClone={() => handleClonePreset(item.ref.id)}
                  onDelete={() => setDeletePresetId(item.ref.id)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {presetDialogMode === 'create' ? 'Create preset' : 'Edit preset'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              name="presetName"
              autoComplete="off"
              value={presetDraft.name}
              onChange={(event) =>
                setPresetDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Preset name"
              aria-invalid={Boolean(presetNameError)}
              aria-describedby={
                presetNameError ? 'preset-name-error' : undefined
              }
            />
            {presetNameError && (
              <p
                id="preset-name-error"
                className="text-xs text-destructive"
                aria-live="polite"
              >
                {presetNameError}
              </p>
            )}
          </div>

          <SettingsFormFields
            serverUrl={presetDraft.serverUrl}
            participantsCsvUrl={presetDraft.participantsCsvUrl}
            classesText={presetDraft.classesCsv}
            serverUrlError={serverUrlError ?? undefined}
            participantsCsvUrlError={participantsCsvUrlError ?? undefined}
            classesHints={classesHints}
            onServerUrlChange={(value) =>
              setPresetDraft((current) => ({ ...current, serverUrl: value }))
            }
            onParticipantsCsvUrlChange={(value) =>
              setPresetDraft((current) => ({
                ...current,
                participantsCsvUrl: value,
              }))
            }
            onClassesTextChange={(value) =>
              setPresetDraft((current) => ({ ...current, classesCsv: value }))
            }
          />

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSavePreset}
              disabled={!canSavePreset}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletePresetId)}
        onOpenChange={(open) => !open && setDeletePresetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Preset "{deletePresetName}" will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeletePreset}
              disabled={presets.userPresets.length <= 1}
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
  mode: PresetDialogMode
  editedPresetId: string | null
}

/**
 * Validates preset name required and uniqueness constraints.
 * @param params Validation params.
 * @param params.value Current name input.
 * @param params.presets Existing presets list.
 * @param params.mode Dialog mode.
 * @param params.editedPresetId Current edited preset id.
 * @returns Error text or null.
 */
function validatePresetName({
  value,
  presets,
  mode,
  editedPresetId,
}: ValidatePresetNameParams): string | null {
  const normalized = value.trim()
  if (!normalized) {
    return 'Preset name is required.'
  }

  const normalizedLower = normalized.toLowerCase()
  const duplicate = presets.find((preset) => {
    if (mode === 'edit' && preset.id === editedPresetId) {
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
 * Generates default unique name for create flow.
 * @param presets Existing presets list.
 * @returns Name value for create draft.
 */
function buildNewPresetName(presets: SettingsPreset[]): string {
  let index = presets.length + 1
  const normalizedNames = new Set(
    presets.map((preset) => preset.name.trim().toLowerCase()),
  )

  while (index < Number.MAX_SAFE_INTEGER) {
    const candidate = `Preset ${index}`
    if (!normalizedNames.has(candidate.toLowerCase())) {
      return candidate
    }
    index += 1
  }

  return `Preset ${Date.now()}`
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
    .map((line) => line.trim())
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
      .map((pattern) => pattern.trim())
      .filter(Boolean)

    if (patterns.length === 0) {
      emptyPatternDefinitions += 1
    }
  }

  if (missingColon > 0) {
    hints.push(
      `Warning: ${missingColon} line(s) miss ":" and will fallback to "ClassName: ClassName".`,
    )
  }
  if (duplicateNames > 0) {
    hints.push(
      `Warning: ${duplicateNames} duplicate class name(s) will be ignored on save.`,
    )
  }
  if (emptyPatternDefinitions > 0) {
    hints.push(
      `Warning: ${emptyPatternDefinitions} line(s) have no patterns and will fallback to class name.`,
    )
  }

  return hints
}

/**
 * Creates normalized settings snapshot from current draft fields.
 * @param serverUrl Draft server URL.
 * @param participantsCsvUrl Draft participants CSV URL.
 * @param classesCsv Draft car class rules text.
 * @returns Snapshot for storage.
 */
function buildDraftSnapshot(
  serverUrl: string,
  participantsCsvUrl: string,
  classesCsv: string,
): SettingsSnapshot {
  return {
    serverUrl: serverUrl.trim(),
    participantsCsvUrl: participantsCsvUrl.trim(),
    carClasses: parseCarClasses(classesCsv),
  }
}

interface PresetRowProps {
  item: ResolvedPreset
  canDelete: boolean
  onEdit?: () => void
  onClone: () => void
  onDelete?: () => void
}

/**
 * Renders one preset row with source-specific action set.
 * @param props Row props.
 * @param props.item Preset metadata and source details.
 * @param props.canDelete Whether delete action is currently allowed.
 * @param props.onEdit Optional edit callback for user presets.
 * @param props.onClone Clone callback for preset row.
 * @param props.onDelete Optional delete callback for user presets.
 * @returns Preset actions row.
 */
function PresetRow({
  item,
  canDelete,
  onEdit,
  onClone,
  onDelete,
}: PresetRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{item.preset.name}</p>
        <span className="rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground">
          {item.source === 'official' ? 'Official' : 'User'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {!item.readOnly && onEdit && (
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={onClone}>
          Clone
        </Button>
        {!item.readOnly && onDelete && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={!canDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Serializes source-aware preset ref for Select value field.
 * @param presetRef Source-aware preset ref.
 * @returns String value or null.
 */
function serializePresetRef(presetRef: PresetRef | null): string | null {
  if (!presetRef) {
    return null
  }

  return `${presetRef.source}:${presetRef.id}`
}

/**
 * Parses Select value into source-aware preset ref.
 * @param value Select value.
 * @returns Parsed preset ref or null.
 */
function parsePresetRef(value: string | null): PresetRef | null {
  if (!value) {
    return null
  }

  const [source, ...idParts] = value.split(':')
  const id = idParts.join(':').trim()
  if (!id || (source !== 'official' && source !== 'user')) {
    return null
  }

  return { source, id }
}

/**
 * Checks whether two source-aware references are equal.
 * @param left Left ref.
 * @param right Right ref.
 * @returns True when source and id are equal.
 */
function presetRefEquals(
  left: PresetRef | null,
  right: PresetRef | null,
): boolean {
  if (!left || !right) {
    return false
  }

  return left.source === right.source && left.id === right.id
}
