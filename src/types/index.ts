export interface Event {
  id:  number;
  name:  string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: 'draft' | 'active' | 'completed';
  statistics?:  {
    total_participants: number;
    eligible_participants: number;
    total_categories: number;
    completed_categories: number;
    total_winners: number;
  };
}

export interface Participant {
  id: number;
  name: string;
  coupon_code:  string;
  phone: string | null;
  email: string | null;
  company: string | null;
  is_eligible: boolean;
}

export interface PrizeCategory {
  id:  number;
  name: string;
  description: string | null;
  winner_count: number;
  prize_value: number | null;
  sort_order: number;
  is_active: boolean;
  is_completed: boolean;
  color_theme: string;
  remaining_winner_count: number;
  eligible_count: number;
  winners?:  Winner[];
}

export interface Winner {
  id: number;
  position: number;
  participant: Participant;
  won_at?:  string;
  is_claimed?:  boolean;
}

export interface RollingParticipant {
  id: number;
  name: string;
  coupon_code: string;
}