
CREATE TABLE IF NOT EXISTS requirements_db (
    id SERIAL PRIMARY KEY,
    product TEXT NOT NULL DEFAULT '',
    requirement_group TEXT NOT NULL DEFAULT '',
    requirement TEXT NOT NULL,
    synonyms TEXT DEFAULT '',
    presence TEXT DEFAULT '',
    check_date DATE,
    risk_comment TEXT DEFAULT '',
    moi_office TEXT DEFAULT '',
    r7_office TEXT DEFAULT '',
    is_new BOOLEAN DEFAULT FALSE,
    proposed_wording TEXT DEFAULT '',
    source TEXT DEFAULT '',
    external_id TEXT DEFAULT '',
    author TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    jira_link TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS analysis_sessions (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_key TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_count INT DEFAULT 0,
    match_count INT DEFAULT 0,
    partial_count INT DEFAULT 0,
    new_count INT DEFAULT 0,
    conflict_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES analysis_sessions(id),
    code TEXT,
    requirement_text TEXT NOT NULL,
    component TEXT DEFAULT '',
    source_file TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    match_percent INT DEFAULT 0,
    matched_db_id INT REFERENCES requirements_db(id),
    analyst_comment TEXT DEFAULT '',
    manual_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requirements_db_product ON requirements_db(product);
CREATE INDEX IF NOT EXISTS idx_requirements_db_group ON requirements_db(requirement_group);
CREATE INDEX IF NOT EXISTS idx_analysis_results_session ON analysis_results(session_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_status ON analysis_results(status);
