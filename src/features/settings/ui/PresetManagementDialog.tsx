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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface PresetManagementDialogProps {
  open: boolean
  presets: SettingsPreset[]
  activePresetId: string | null
  activeSettings: SettingsSnapshot | null
  onOpenChange: (open: boolean) => void
  onSelectPreset: (presetId: string) => void
  onCreatePreset: (settings: SettingsSnapshot, name?: string) => void
  onRenameActivePreset: (name: string) => void
  onDeleteActivePreset: () => void
  onSaveActivePreset: (settings: SettingsSnapshot) => void
}

const EMPTY_SETTINGS: SettingsSnapshot = {
  serverUrl: '',
  carClasses: [],
  participants: {
    csvUrl: '',
  },
}

/**
 * Dedicated preset CRUD dialog that isolates advanced operations from quick settings.
 * @param props Dialog state and preset management callbacks.
 * @param props.open Controls visibility of the management dialog.
 * @param props.presets Full preset list available to user.
 * @param props.activePresetId Current active preset id.
 * @param props.activeSettings Current active preset snapshot.
 * @param props.onOpenChange Callback invoked on open state changes.
 * @param props.onSelectPreset Callback to activate another preset.
 * @param props.onCreatePreset Callback to create a new preset from draft.
 * @param props.onRenameActivePreset Callback to rename currently active preset.
 * @param props.onDeleteActivePreset Callback to delete currently active preset.
 * @param props.onSaveActivePreset Callback to persist settings into active preset.
 * @returns Full preset management dialog with validation and delete confirmation.
 */
export function PresetManagementDialog({
  open,
  presets,
  activePresetId,
  activeSettings,
  onOpenChange,
  onSelectPreset,
  onCreatePreset,
  onRenameActivePreset,
  onDeleteActivePreset,
  onSaveActivePreset,
}: PresetManagementDialogProps) {
  const [serverUrl, setServerUrl] = useState('')
  const [participantsCsvUrl, setParticipantsCsvUrl] = useState('')
  const [classesCsv, setClassesCsv] = useState('')
  const [presetName, setPresetName] = useState('')
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
  }

  /**
   * Resolves active preset display name from current preset list.
   */
  const activePresetName = useMemo(() => {
    return presets.find(preset => preset.id === activePresetId)?.name ?? 'Preset'
  }, [presets, activePresetId])

  /**
   * Synchronizes local draft inputs with current active preset payload.
   */
  const syncDraftFromActivePreset = () => {
    applySnapshotToDraft(activeSettings)
    setPresetName(activePresetName)
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
  const canPersist = Boolean(activePresetId) && !serverUrlError && !participantsCsvUrlError
  const canCreate = !serverUrlError && !participantsCsvUrlError

  /**
   * Selects preset for management and immediately reflects it in local draft inputs.
   * @param presetId Target preset id from selector.
   */
  const handleSelectPreset = (presetId: string) => {
    onSelectPreset(presetId)
    const selectedPreset = presets.find(preset => preset.id === presetId)
    applySnapshotToDraft(selectedPreset?.settings ?? null)
    setPresetName(selectedPreset?.name ?? 'Preset')
  }

  /**
   * Saves current draft over the active preset and applies name change in one action.
   */
  const handleSaveActivePreset = () => {
    if (!canPersist) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv)
    onRenameActivePreset(presetName)
    onSaveActivePreset(nextSnapshot)
    onOpenChange(false)
  }

  /**
   * Creates a brand-new preset from current draft and switches active preset to it.
   */
  const handleCreatePreset = () => {
    if (!canCreate) {
      return
    }

    const nextSnapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv)
    onCreatePreset(nextSnapshot, presetName)
  }

  /**
   * Executes active preset deletion after user confirmation.
   */
  const handleDeletePreset = () => {
    const nextPresetAfterDelete = presets.find(preset => preset.id !== activePresetId) ?? null
    setDeleteDialogOpen(false)
    onDeleteActivePreset()
    applySnapshotToDraft(nextPresetAfterDelete?.settings ?? null)
    setPresetName(nextPresetAfterDelete?.name ?? 'Preset')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preset Management</DialogTitle>
            <DialogDescription>
              Create and edit presets for server URL, participants CSV URL and car classes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label id="preset-select-label" className="text-right">Preset</Label>
              <div className="col-span-3">
                <Select value={activePresetId ?? undefined} onValueChange={value => value && handleSelectPreset(value)}>
                  <SelectTrigger aria-labelledby="preset-select-label" className="w-full">
                    <SelectValue placeholder="Select preset">
                      {activePresetName}
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
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preset-name" className="text-right">Preset Name</Label>
              <div className="col-span-3">
                <Input
                  id="preset-name"
                  name="presetName"
                  autoComplete="off"
                  value={presetName}
                  onChange={event => setPresetName(event.target.value)}
                  placeholder="Preset name"
                />
              </div>
            </div>
          </div>

          <SettingsFormFields
            serverUrl={serverUrl}
            participantsCsvUrl={participantsCsvUrl}
            classesText={classesCsv}
            serverUrlError={serverUrlError ?? undefined}
            participantsCsvUrlError={participantsCsvUrlError ?? undefined}
            onServerUrlChange={setServerUrl}
            onParticipantsCsvUrlChange={setParticipantsCsvUrl}
            onClassesTextChange={setClassesCsv}
          />

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={presets.length <= 1}
            >
              Delete Active
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCreatePreset} disabled={!canCreate}>
                Create New
              </Button>
              <Button type="button" onClick={handleSaveActivePreset} disabled={!canPersist}>
                Save Active
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Preset "
              {activePresetName}
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
 * Creates a normalized settings snapshot from current dialog fields.
 * @param serverUrl Draft server URL.
 * @param participantsCsvUrl Draft participants CSV URL.
 * @param classesCsv Draft car class rules text.
 * @returns Normalized snapshot payload for storage.
 */
function buildDraftSnapshot(
  serverUrl: string,
  participantsCsvUrl: string,
  classesCsv: string,
): SettingsSnapshot {
  return {
    serverUrl: serverUrl.trim(),
    participants: {
      csvUrl: participantsCsvUrl.trim(),
    },
    carClasses: parseCarClasses(classesCsv),
  }
}
