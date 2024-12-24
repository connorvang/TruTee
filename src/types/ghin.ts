interface GHINScoreResponse {
  recent_scores: {
    scores: GHINScore[];
  };
  revision_scores: {
    scores: GHINScore[];
  };
  nine_hole_score: {
    scores: GHINScore[];
  };
  deleted_scores: {
    scores: GHINScore[];
  };
  score_history_stats: {
    total_count: number;
    lowest_score: number;
    highest_score: number;
    average: number;
  };
}

interface GHINScore {
  id: number;
  order_number: number;
  score_day_order: number;
  gender: string;
  status: string;
  is_manual: boolean;
  number_of_holes: number;
  number_of_played_holes: number;
  golfer_id: number;
  facility_name: string;
  adjusted_gross_score: number;
  posted_on_home_course: boolean;
  played_at: string;
  course_id: string | null;
  course_name: string;
  tee_name: string;
  tee_set_id: string | null;
  tee_set_side: string;
  differential: number;
  course_rating: number;
  slope_rating: number;
  score_type: string;
  score_type_display_full: string;
  score_type_display_short: string;
  posted_at: string;
  course_display_value: string;
  ghin_course_name_display: string;
  used: boolean;
  pcc: number;
  hole_details: HoleDetail[];
  statistics: ScoreStatistics;
  exceptional: boolean;
  is_recent: boolean;
  net_score_differential: number | null;
  short_course: null;
}

interface HoleDetail {
  id: number;
  adjusted_gross_score: number;
  raw_score: number;
  hole_number: number;
  par: number;
  putts: number | null;
  fairway_hit: boolean | null;
  gir_flag: boolean | null;
  drive_accuracy: number | null;
  stroke_allocation: number;
  approach_shot_accuracy: number | null;
  x_hole: boolean;
  most_likely_score: null;
}

interface ScoreStatistics {
  putts_total: string;
  one_putt_or_better_percent: string;
  two_putt_percent: string;
  three_putt_or_worse_percent: string;
  two_putt_or_better_percent: string;
  up_and_downs_total: string;
  par3s_average: string;
  par4s_average: string;
  par5s_average: string;
  pars_percent: string;
  birdies_or_better_percent: string;
  bogeys_percent: string;
  double_bogeys_percent: string;
  triple_bogeys_or_worse_percent: string;
  fairway_hits_percent: string;
  gir_percent: string;
  last_stats_update_date: string;
  last_stats_update_type: string;
} 