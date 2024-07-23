env "local" {
  url = "postgres://admin:admin1@localhost:5432/uploader?sslmode=disable"
  to = "file://schema.sql"
  dev = "docker://postgres/15/dev"
  migration {
    dir = "file://migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}