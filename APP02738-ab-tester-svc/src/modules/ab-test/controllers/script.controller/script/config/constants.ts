const constants = {
  cookie: {
    duration: 365,
    max: 10000000000,
    min: 0,
    name: 'ab_test_id_v1',
  },
  windowKey: 'ab_tester',
} as const;

export default constants;
