// @anchor: leaderboard/pages/live-timing/ui/settings-dialog
// @intent: Lightweight settings dialog for preset selection plus entrypoint to advanced preset management.
import type { SettingsPreset, SettingsSnapshot } from '@/shared/types'
import { IconSettings } from '@tabler/icons-react'
import { useState } from 'react'
import {
  DEFAULT_PACE_PERCENT_THRESHOLD,
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
} from '@/shared/config/constants'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { validatePacePercentThreshold } from '../../model/settings/validate'
import { PresetControls } from './PresetControls'
import { PresetManagementDialog } from './PresetManagementDialog'

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
  const [pacePercentThreshold, setPacePercentThreshold] = useState(
    () => activeSettings?.pacePercentThreshold?.toString() ?? DEFAULT_PACE_PERCENT_THRESHOLD.toString(),
  )

  const selectedPreset = presets.find(preset => preset.id === pendingPresetId) ?? null
  const selectedSettings = selectedPreset?.settings ?? activeSettings
  const thresholdError = validatePacePercentThreshold(pacePercentThreshold)
  const hasThresholdChanged = selectedSettings
    ? Number.parseInt(pacePercentThreshold, 10) !== selectedSettings.pacePercentThreshold
    : false
  const canSave = Boolean(pendingPresetId)
    && !thresholdError
    && (pendingPresetId !== activePresetId || hasThresholdChanged)

  /**
   * Opens quick settings dialog for preset selection.
   */
  const openSettings = () => {
    setPendingPresetId(activePresetId)
    setPacePercentThreshold((activeSettings?.pacePercentThreshold ?? DEFAULT_PACE_PERCENT_THRESHOLD).toString())
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
      setPacePercentThreshold((activeSettings?.pacePercentThreshold ?? DEFAULT_PACE_PERCENT_THRESHOLD).toString())
    }
  }

  /**
   * Selects active preset from quick settings.
   * @param presetId Selected preset id.
   */
  const handleSelectPreset = (presetId: string) => {
    setPendingPresetId(presetId)
    const preset = presets.find(item => item.id === presetId)
    setPacePercentThreshold((preset?.settings.pacePercentThreshold ?? DEFAULT_PACE_PERCENT_THRESHOLD).toString())
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
    if (!pendingPresetId || thresholdError) {
      return
    }

    const preset = presets.find(item => item.id === pendingPresetId)
    if (preset) {
      onSavePreset(pendingPresetId, {
        ...preset.settings,
        pacePercentThreshold: Number.parseInt(pacePercentThreshold, 10),
      })
    }

    if (pendingPresetId !== activePresetId) {
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

          <div className="grid gap-1.5">
            <Label htmlFor="quick-pace-threshold">
              Pace Threshold (%)
            </Label>
            <Input
              id="quick-pace-threshold"
              name="quickPacePercentThreshold"
              type="number"
              inputMode="numeric"
              min={MIN_PACE_PERCENT_THRESHOLD}
              max={MAX_PACE_PERCENT_THRESHOLD}
              step={1}
              value={pacePercentThreshold}
              onChange={event => setPacePercentThreshold(event.target.value)}
              aria-invalid={Boolean(thresholdError)}
              aria-describedby={thresholdError ? 'quick-pace-threshold-error' : 'quick-pace-threshold-help'}
            />
            <p id="quick-pace-threshold-help" className="text-[0.8rem] text-muted-foreground">
              Range:
              {' '}
              {MIN_PACE_PERCENT_THRESHOLD}
              -
              {MAX_PACE_PERCENT_THRESHOLD}
              %
            </p>
            {thresholdError && (
              <p id="quick-pace-threshold-error" className="text-xs text-destructive" aria-live="polite">
                {thresholdError}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" onClick={handleSave} disabled={!canSave}>
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
