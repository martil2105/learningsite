<script>
  import NaiveSplitFigure from "./NaiveSplitFigure.svelte";
</script>

<p class="body-text">
  Ada builds things. Bo knows everyone worth knowing. Cleo is the specialist you
  call when a job has one genuinely hard part in it. Working together for a year,
  the three of them bill <span class="bold">120</span>.
</p>

<p class="body-text">
  Now split it. You know more than just the total, because you also know what
  every smaller version of this team could have managed. Ada on her own would
  have found enough work to bill 15. Bo, who can win contracts but has to
  subcontract the delivery, 30. Cleo, who is superb and unknown, nothing at all —
  she cannot win a job by herself. Ada and Bo together, 75. Ada and Cleo, 45. Bo
  and Cleo, 60.
</p>

<p class="body-text">
  Two answers suggest themselves immediately, and both fall apart on contact.
</p>

<NaiveSplitFigure />

<p class="body-text">
  Paying everyone what they could have billed alone hands out 45 and leaves 75 on
  the table — the entire reason they teamed up is the part nobody gets paid for.
  Paying everyone what the team would lose without them is worse: it promises 180
  against a fee of 120. Both Ada and Bo can truthfully say "drop me and you lose
  60" and "drop me and you lose 75", and both are right, and there is no
  contradiction, because you cannot drop them both.
</p>

<p class="body-text">
  That is the actual difficulty. Contributions overlap. Cleo is worth nothing on
  her own and 45 to whichever pair she joins, so any honest answer has to depend
  on <em>who she is standing next to</em> — and there is no single fact of the
  matter about who she is standing next to.
</p>

<p class="body-text">
  Lloyd Shapley's move, in 1953, was to stop looking for one. If the credit
  depends on the order people showed up in, then consider every order they could
  have shown up in, give each person what they added on arrival, and average.
</p>
