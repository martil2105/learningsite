<script>
  import NaiveSplitFigure from "./NaiveSplitFigure.svelte";
</script>

<p class="body-text">
  Meet Ada, Bo and Cleo. Ada builds things, Bo knows everyone worth knowing, and
  Cleo is the specialist you call when a job has one especially hard part in it.
  Working together for a year, the three of them bill
  <span class="bold">120</span>.
</p>

<p class="body-text">
  How should they split it? We know more than just the total, because we also
  know what every smaller version of this team could have managed. On her own,
  Ada would have found enough work to bill 15. Bo, who can win contracts but has
  to subcontract the delivery, would have billed 30. Cleo, who is superb but
  unknown, would have billed nothing at all, since she can't win a job by
  herself. Together, Ada and Bo would have billed 75, Ada and Cleo 45, and Bo and
  Cleo 60.
</p>

<p class="body-text">
  Two answers come to mind right away, but both fall apart as soon as we try
  them.
</p>

<NaiveSplitFigure />

<p class="body-text">
  If we pay everyone what they could have billed alone, we hand out 45 and leave
  75 on the table, so the whole reason they teamed up is the part nobody gets
  paid for. Paying everyone what the team would lose without them is even worse,
  since it promises 180 against a fee of 120. Ada can truthfully say "drop me and
  you lose 60", and Bo can say "drop me and you lose 75". Both are right, and
  there's no contradiction, because you can't drop them both.
</p>

<p class="body-text">
  This is the real difficulty: contributions overlap. Cleo is worth nothing on
  her own and 45 to whichever pair she joins, so any fair answer has to depend on
  <em>who she's standing next to</em>, and there's no single fact about who she's
  standing next to.
</p>

<p class="body-text">
  In 1953, Lloyd Shapley's solution was to stop looking for one. If the credit
  depends on the order in which people showed up, then we should consider every
  order they could have shown up in, give each person what they added when they
  arrived, and take the average. Try it yourself below.
</p>
