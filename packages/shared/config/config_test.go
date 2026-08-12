package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	cfg, err := Load("test")
	if err != nil {
		t.Fatal(err)
	}
	if cfg.ServiceName != "test" {
		t.Fatal(cfg.ServiceName)
	}
	if cfg.DatabaseURL == "" || cfg.RedisURL == "" {
		t.Fatal("missing defaults")
	}
}
