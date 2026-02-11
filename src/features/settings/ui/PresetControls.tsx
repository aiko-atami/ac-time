// @anchor: leaderboard/features/settings/ui/preset-controls
// @intent: Minimal preset controls for quick preset switching from settings dialog.
import type { SettingsPreset } from '@/lib/types'
import { Button } from '@/components/ui/button'
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
    <div className="grid gap-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <span id="settings-preset-label" className="text-right text-sm font-medium">Preset</span>
        <div className="col-span-3">
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
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <span className="text-right text-sm font-medium">Actions</span>
        <div className="col-span-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onManagePresets}>
            Manage Presets
          </Button>
        </div>
      </div>
    </div>
  )
}
