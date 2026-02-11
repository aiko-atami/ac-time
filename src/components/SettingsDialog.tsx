// @anchor: leaderboard/components/settings-dialog
// @intent: Settings modal that edits active preset and manages preset lifecycle.
import type { SettingsPreset, SettingsSnapshot } from '@/lib/types'
import { IconSettings } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
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
import { formatCarClasses, parseCarClasses } from '@/features/settings/model/serialize'
import { PresetControls } from '@/features/settings/ui/PresetControls'
import { SettingsFormFields } from '@/features/settings/ui/SettingsFormFields'

interface SettingsDialogProps {
  presets: SettingsPreset[]
  activePresetId: string | null
  activeSettings: SettingsSnapshot | null
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
 * Renders and controls the settings dialog state.
 * @param props Settings dialog props.
 * @returns Settings trigger button and dialog.
 */
export function SettingsDialog({
  presets,
  activePresetId,
  activeSettings,
  onSelectPreset,
  onCreatePreset,
  onRenameActivePreset,
  onDeleteActivePreset,
  onSaveActivePreset,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [serverUrl, setServerUrl] = useState('')
  const [participantsCsvUrl, setParticipantsCsvUrl] = useState('')
  const [classesCsv, setClassesCsv] = useState('')
  const [presetName, setPresetName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  /**
   * Applies snapshot values to local form state.
   * @param settings Snapshot values to apply.
   */
  const applySnapshotToDraft = (settings: SettingsSnapshot | null) => {
    const safe = settings ?? EMPTY_SETTINGS
    setServerUrl(safe.serverUrl)
    setParticipantsCsvUrl(safe.participants.csvUrl)
    setClassesCsv(formatCarClasses(safe.carClasses))
  }

  useEffect(() => {
    if (open) {
      applySnapshotToDraft(activeSettings)
    }
  }, [open, activeSettings, activePresetId])

  const activePresetName = useMemo(() => {
    return presets.find(preset => preset.id === activePresetId)?.name ?? 'Preset'
  }, [presets, activePresetId])

  useEffect(() => {
    setPresetName(activePresetName)
  }, [activePresetName])

  const serverUrlError = validateRequiredHttpUrl(serverUrl)
  const participantsCsvUrlError = validateRequiredHttpUrl(participantsCsvUrl)

  const canSave = Boolean(activePresetId) && !serverUrlError && !participantsCsvUrlError

  /**
   * Handles opening and closing the settings dialog.
   * @param nextOpen Next open state.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      applySnapshotToDraft(activeSettings)
    }
    setOpen(nextOpen)
  }

  /**
   * Selects a preset and immediately syncs draft fields with it.
   * @param presetId Selected preset id.
   */
  const handleSelectPreset = (presetId: string) => {
    onSelectPreset(presetId)
    const preset = presets.find(item => item.id === presetId)
    applySnapshotToDraft(preset?.settings ?? null)
  }

  /**
   * Creates a new preset from current draft values.
   */
  const handleCreatePreset = () => {
    const snapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv)
    onCreatePreset(snapshot, presetName)
  }

  /**
   * Renames currently active preset.
   */
  const handleRenamePreset = () => {
    onRenameActivePreset(presetName)
  }

  /**
   * Deletes currently active preset after confirmation.
   */
  const handleDeletePreset = () => {
    setDeleteDialogOpen(false)
    onDeleteActivePreset()
  }

  /**
   * Saves current draft to active preset.
   */
  const handleSave = () => {
    if (!canSave) {
      return
    }

    const snapshot = buildDraftSnapshot(serverUrl, participantsCsvUrl, classesCsv)
    onSaveActivePreset(snapshot)
    handleOpenChange(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleOpenChange(true)}
        title="Settings"
        aria-label="Settings"
      >
        <IconSettings className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage presets for server URL, participants CSV URL and car classes.
            </DialogDescription>
          </DialogHeader>
          <PresetControls
            presets={presets}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onCreatePreset={handleCreatePreset}
            onRenamePreset={handleRenamePreset}
            onDeletePreset={() => setDeleteDialogOpen(true)}
            canDeletePreset={presets.length > 1}
            presetName={presetName}
            onPresetNameChange={setPresetName}
          />

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

          <DialogFooter>
            <Button onClick={handleSave} disabled={!canSave}>Save changes</Button>
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
 * Validates required HTTP URL input.
 * @param value URL value.
 * @returns Validation error or null when valid.
 */
function validateRequiredHttpUrl(value: string): string | null {
  if (!value.trim()) {
    return 'URL is required.'
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
 * Builds normalized snapshot from current form fields.
 * @param serverUrl Server URL field value.
 * @param participantsCsvUrl Participants CSV URL field value.
 * @param classesCsv Class rules multiline value.
 * @returns Normalized settings snapshot.
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
