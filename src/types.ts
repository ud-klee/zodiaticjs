export type Lunar = {
  date: string;
  lunar_number: number[];
  lunar: string;
  eight_words: string;
  god_direction: string;
  good_for: string;
  bad_for: string;
};

export type QueryMsg = {
  get_lunar: {
    yyyymmdd: number;
  };
};

export type GetLunarResponse = {
  lunar: Lunar;
};

export type ExecuteMsg = {
  create_lunar: { yyyymmdd: number; lunar: Lunar };
};
