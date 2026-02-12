// @anchor: leaderboard/features/settings/ui/preset-controls
// @intent: Minimal preset controls for quick preset switching from settings dialog.
import type { SettingsPreset } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PresetControlsProps {
  presets: SettingsPreset[]
  activePresetId: string | null
  onSelectPreset: (presetId: string) => void
  onManagePresets: () => void
}

/**
 * Renders preset selection and opens dedicated preset management dialog.
 * @param props Preset controls props.
 * @param props.presets Available preset options.
 * @param props.activePresetId Currently active preset id.
 * @param props.onSelectPreset Called when user selects a preset from dropdown.
 * @param props.onManagePresets Opens separate preset management dialog.
 * @returns Preset controls block.
 */
export function PresetControls({
  presets,
  activePresetId,
  onSelectPreset,
  onManagePresets,
}: PresetControlsProps) {
  const activePresetName = presets.find(preset => preset.id === activePresetId)?.name

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label id="settings-preset-label">Active preset</Label>
        <div className="flex items-center gap-2">
          <Select value={activePresetId ?? undefined} onValueChange={value => value && onSelectPreset(value)}>
            <SelectTrigger aria-labelledby="settings-preset-label" className="w-full">
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
          <Button type="button" size="default" variant="outline" onClick={onManagePresets}>
            Manage
          </Button>
        </div>
      </div>
    </div>
  )
}
