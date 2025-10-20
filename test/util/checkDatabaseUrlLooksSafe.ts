/**
 * Better be safe than sorry, we don't want to bulk DELETE non-local databases
 * GIFLENS-https://media.giphy.com/media/XqpnXaeZPnupy/giphy.gif
 *
 * This is based on lived experience (horror stories in the past) of many of us
 */

export const checkDatabaseUrlLooksSafe = () => {
  const DATABASE_URL = process.env.DATABASE_URL ?? undefined;

  console.log('====== checkDatabaseUrlLooksSafe ======');
  console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);

  if (
    !DATABASE_URL ||
    ![
      // purge / seed local dev
      'postgresql://postgres:postgres@localhost:5432/espera_queue_local_test_db',
      // running tests locally
      'postgresql://postgres:postgres@localhost:5432/espera_queue_local_test_db_ci',
      // running tests locally in docker
      'postgresql://postgres:postgres@host.docker.internal:5432/espera_queue_local_test_db?connect_timeout=300',
      // when running in CI
      'postgresql://postgres:postgres@espera_queue_local_test_db_ci:5432/espera_queue_local_test_db_ci?connect_timeout=300',
    ].includes(DATABASE_URL)
  ) {
    throw new Error(`
      It looks like you have an incorrect DATABASE_URL value ${process.env.DATABASE_URL} in your .env file.
      Aborting local DB seeding/purging for safety.
      `);
  }
};
