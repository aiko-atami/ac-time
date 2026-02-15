// @anchor: leaderboard/features/settings/ui/preset-controls
// @intent: Minimal preset controls for quick preset switching from settings dialog.
import type { SettingsPreset } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

interface PresetControlsProps {
  presets: SettingsPreset[]
  selectedPresetId: string | null
  onSelectPreset: (presetId: string) => void
  onManagePresets: () => void
}

/**
 * Renders preset selection and opens dedicated preset management dialog.
 * @param props Preset controls props.
 * @param props.presets Available preset options.
 * @param props.selectedPresetId Currently selected preset id in quick settings draft.
 * @param props.onSelectPreset Called when user selects a preset from dropdown.
 * @param props.onManagePresets Opens separate preset management dialog.
 * @returns Preset controls block.
 */
export function PresetControls({
  presets,
  selectedPresetId,
  onSelectPreset,
  onManagePresets,
}: PresetControlsProps) {
  const selectedPresetName = presets.find(preset => preset.id === selectedPresetId)?.name

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label id="settings-preset-label">Selected preset</Label>
        <div className="flex items-center gap-2">
          <Select value={selectedPresetId ?? undefined} onValueChange={value => value && onSelectPreset(value)}>
            <SelectTrigger aria-labelledby="settings-preset-label" className="w-full">
              <SelectValue placeholder="Select preset">
                {selectedPresetName}
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
          <Button type="button" size="default" variant="outline" onClick={onManagePresets}>
            Manage
          </Button>
        </div>
      </div>
    </div>
  )
}
