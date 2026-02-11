// @anchor: leaderboard/components/settings-dialog
// @intent: Lightweight settings dialog for preset selection plus entrypoint to advanced preset management.
import type { SettingsPreset, SettingsSnapshot } from '@/lib/types'
import { IconSettings } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  onRenameActivePreset: (name: string) => void
  onDeleteActivePreset: () => void
  onSaveActivePreset: (settings: SettingsSnapshot) => void
}

/**
 * Renders quick preset selector and routes advanced CRUD into dedicated management dialog.
 * @param props Settings dialog props.
 * @param props.presets Available settings presets list.
 * @param props.activePresetId Active preset id.
 * @param props.activeSettings Active preset settings snapshot.
 * @param props.onSelectPreset Selects preset by id.
 * @param props.onCreatePreset Creates preset from snapshot and optional name.
 * @param props.onRenameActivePreset Renames active preset.
 * @param props.onDeleteActivePreset Deletes active preset.
 * @param props.onSaveActivePreset Saves settings into active preset.
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)

  /**
   * Opens quick settings dialog for preset selection.
   */
  const openSettings = () => setSettingsOpen(true)

  /**
   * Handles quick settings visibility toggles.
   * @param open Next dialog open state.
   */
  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsOpen(open)
  }

  /**
   * Selects active preset from quick settings.
   * @param presetId Selected preset id.
   */
  const handleSelectPreset = (presetId: string) => {
    onSelectPreset(presetId)
  }

  /**
   * Transitions from quick settings into advanced preset management dialog.
   */
  const handleManagePresets = () => {
    setSettingsOpen(false)
    setManagementOpen(true)
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Quickly switch active preset. Use management dialog for create/edit/delete.
            </DialogDescription>
          </DialogHeader>

          <PresetControls
            presets={presets}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onManagePresets={handleManagePresets}
          />
        </DialogContent>
      </Dialog>

      <PresetManagementDialog
        open={managementOpen}
        presets={presets}
        activePresetId={activePresetId}
        activeSettings={activeSettings}
        onOpenChange={setManagementOpen}
        onSelectPreset={onSelectPreset}
        onCreatePreset={onCreatePreset}
        onRenameActivePreset={onRenameActivePreset}
        onDeleteActivePreset={onDeleteActivePreset}
        onSaveActivePreset={onSaveActivePreset}
      />
    </>
  )
}
