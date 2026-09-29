<script>
  let { label, value, color = "", id = "" } = $props();
</script>

<div class="readout" {id}>
  <span class="label">{label}</span>
  <span class="value" style={color ? `color:${color}` : ""}>{value}</span>
</div>
