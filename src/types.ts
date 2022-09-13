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
  find_lunar: {
    year: number;
    predicates: Predicate[];
  };
};

export type Predicate = And | AndNot;

type And = {
  and: Condition[];
};

type AndNot = {
  and_not: Condition[];
};

type Condition = [string, string];

export type GetLunarResponse = {
  lunar: Lunar;
};

export type FindLunarResponse = {
  result: Lunar[];
};

export type ExecuteMsg = {
  create_lunar: { yyyymmdd: number; lunar: Lunar };
};
