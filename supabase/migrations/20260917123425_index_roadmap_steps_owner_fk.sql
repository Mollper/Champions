-- Covering index for the composite FK roadmap_steps (roadmap_id, user_id) → roadmaps (id, user_id).
-- Flagged by the `unindexed_foreign_keys` advisor; speeds up cascades from roadmaps.
create index roadmap_steps_roadmap_id_user_id_idx
  on public.roadmap_steps (roadmap_id, user_id);
