// @anchor: leaderboard/widgets/settings-dialog/ui
// @intent: Lightweight settings dialog for preset selection plus entrypoint to advanced preset management.
import type { SettingsPreset, SettingsSnapshot } from '@/lib/types'
import { IconSettings } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PresetControls } from '@/features/settings/ui/PresetControls'
import { PresetManagementDialog } from '@/features/settings/ui/PresetManagementDialog'

interface SettingsDialogProps {
  presets: SettingsPreset[]
  activePresetId: string | null
  activeSettings: SettingsSnapshot | null
  onSelectPreset: (presetId: string) => void
  onCreatePreset: (settings: SettingsSnapshot, name?: string) => void
  onRenamePreset: (presetId: string, name: string) => void
  onDeletePreset: (presetId: string) => void
  onSavePreset: (presetId: string, settings: SettingsSnapshot) => void
}

/**
 * Renders quick preset selector and routes advanced CRUD into dedicated management dialog.
 * @param props Settings dialog props.
 * @param props.presets Available settings presets list.
 * @param props.activePresetId Active preset id.
 * @param props.activeSettings Active preset settings snapshot.
 * @param props.onSelectPreset Selects preset by id.
 * @param props.onCreatePreset Creates preset from snapshot and optional name.
 * @param props.onRenamePreset Renames selected preset by id.
 * @param props.onDeletePreset Deletes selected preset by id.
 * @param props.onSavePreset Saves settings into selected preset by id.
 * @returns Settings trigger button and dialog.
 */
export function SettingsDialog({
  presets,
  activePresetId,
  activeSettings,
  onSelectPreset,
  onCreatePreset,
  onRenamePreset,
  onDeletePreset,
  onSavePreset,
}: SettingsDialogProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(activePresetId)

  /**
   * Opens quick settings dialog for preset selection.
   */
  const openSettings = () => {
    setPendingPresetId(activePresetId)
    setSettingsOpen(true)
  }

  /**
   * Handles quick settings visibility toggles.
   * @param open Next dialog open state.
   */
  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsOpen(open)
    if (!open) {
      setPendingPresetId(activePresetId)
    }
  }

  /**
   * Selects active preset from quick settings.
   * @param presetId Selected preset id.
   */
  const handleSelectPreset = (presetId: string) => {
    setPendingPresetId(presetId)
  }

  /**
   * Transitions from quick settings into advanced preset management dialog.
   */
  const handleManagePresets = () => {
    setPendingPresetId(activePresetId)
    setSettingsOpen(false)
    setManagementOpen(true)
  }

  /**
   * Commits pending preset selection and closes quick settings dialog.
   */
  const handleSave = () => {
    if (pendingPresetId && pendingPresetId !== activePresetId) {
      onSelectPreset(pendingPresetId)
    }
    setSettingsOpen(false)
  }

  /**
   * Handles management dialog close and returns user to quick settings.
   * @param open Next management dialog open state.
   */
  const handleManagementOpenChange = (open: boolean) => {
    setManagementOpen(open)
    if (!open) {
      setPendingPresetId(activePresetId)
      setSettingsOpen(true)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={openSettings}
        title="Settings"
        aria-label="Settings"
      >
        <IconSettings className="h-5 w-5" />
      </Button>

      <Dialog open={settingsOpen} onOpenChange={handleSettingsOpenChange}>
        <DialogContent className="flex flex-col gap-6 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div>
            <PresetControls
              presets={presets}
              selectedPresetId={pendingPresetId}
              onSelectPreset={handleSelectPreset}
              onManagePresets={handleManagePresets}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" onClick={handleSave} disabled={!pendingPresetId || pendingPresetId === activePresetId}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {managementOpen && (
        <PresetManagementDialog
          open={managementOpen}
          presets={presets}
          activePresetId={activePresetId}
          activeSettings={activeSettings}
          onOpenChange={handleManagementOpenChange}
          onCreatePreset={onCreatePreset}
          onRenamePreset={onRenamePreset}
          onDeletePreset={onDeletePreset}
          onSavePreset={onSavePreset}
        />
      )}
    </>
  )
}
