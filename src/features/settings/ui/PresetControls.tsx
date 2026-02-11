// @anchor: leaderboard/features/settings/ui/preset-controls
// @intent: Controls for selecting and managing settings presets.
import type { SettingsPreset } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  onCreatePreset: () => void
  onRenamePreset: () => void
  onDeletePreset: () => void
  canDeletePreset: boolean
  presetName: string
  onPresetNameChange: (value: string) => void
}

/**
 * Renders preset selection and CRUD controls.
 * @param props Preset controls props.
 * @returns Preset controls block.
 */
export function PresetControls({
  presets,
  activePresetId,
  onSelectPreset,
  onCreatePreset,
  onRenamePreset,
  onDeletePreset,
  canDeletePreset,
  presetName,
  onPresetNameChange,
}: PresetControlsProps) {
  const activePresetName = presets.find(preset => preset.id === activePresetId)?.name

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <span className="text-right text-sm font-medium">Preset</span>
        <div className="col-span-3">
          <Select value={activePresetId ?? undefined} onValueChange={value => value && onSelectPreset(value)}>
            <SelectTrigger className="w-full">
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
        <span className="text-right text-sm font-medium">Preset Name</span>
        <div className="col-span-3">
          <Input
            value={presetName}
            onChange={event => onPresetNameChange(event.target.value)}
            placeholder="Preset name"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <span className="text-right text-sm font-medium">Actions</span>
        <div className="col-span-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onCreatePreset}>Create From Draft</Button>
          <Button type="button" size="sm" variant="outline" onClick={onRenamePreset}>Rename Active</Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onDeletePreset}
            disabled={!canDeletePreset}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
