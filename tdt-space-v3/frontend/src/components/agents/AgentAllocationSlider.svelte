<script lang="ts">
  interface Props {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }

  let { label, value, onChange }: Props = $props();

  let inputValue = $state('');
  let isEditing = $state(false);

  // Sync inputValue when value prop changes
  $effect(() => {
    if (!isEditing) {
      inputValue = value.toString();
    }
  });

  // Get the current value through a getter to avoid stale closure
  let getValue = $derived(() => value);

  function handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;
    const num = parseInt(target.value);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    }
  }

  function handleBlur() {
    isEditing = false;
    const num = parseInt(inputValue);
    const currentValue = getValue();
    if (isNaN(num) || num < 0) {
      inputValue = currentValue.toString();
    }
  }

  function increment() {
    const currentValue = getValue();
    onChange(currentValue + 1);
    inputValue = (currentValue + 1).toString();
  }

  function decrement() {
    const currentValue = getValue();
    if (currentValue > 0) {
      onChange(currentValue - 1);
      inputValue = (currentValue - 1).toString();
    }
  }
</script>

<div class="allocation-slider">
  <span class="label">{label}</span>
  <div class="controls">
    <button class="btn-decrement" onclick={decrement} disabled={value <= 0}>−</button>
    <input
      type="text"
      class="value-input"
      bind:value={inputValue}
      oninput={handleInputChange}
      onblur={handleBlur}
      onfocus={() => isEditing = true}
    />
    <button class="btn-increment" onclick={increment}>+</button>
  </div>
</div>

<style>
  .allocation-slider {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
  }

  .label {
    color: #cdd6f4;
    font-size: 14px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .value-input {
    width: 50px;
    text-align: center;
    background: #313244;
    border: 1px solid #45475a;
    color: #cdd6f4;
    padding: 6px;
    border-radius: 4px;
    font-size: 14px;
  }

  .btn-increment,
  .btn-decrement {
    width: 28px;
    height: 28px;
    background: #313244;
    border: 1px solid #45475a;
    color: #cdd6f4;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .btn-increment:hover,
  .btn-decrement:hover {
    background: #41435a;
  }

  .btn-decrement:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
