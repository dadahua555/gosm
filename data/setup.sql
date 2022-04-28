CREATE TABLE services (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT NOT NULL,
	    protocol TEXT NOT NULL,
	    host TEXT NOT NULL,
	    port TEXT,
	    grp TEXT NOT NULL,
	    emails TEXT,
	    unique(name,protocol,host,port,grp) on conflict replace,
	    enabled int default 1 NOT NULL
);

CREATE TABLE checklog(
	    id TEXT NOT NULL,
	    status TEXT NOT NULL,
	    logtime  VARCHAR (20)
);

create index checklogindex on checklog(id,logtime);
