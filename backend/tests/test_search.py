def test_search_smoke(client):
    r = client.get("/api/search", query_string={"q": "rose gold"})
    assert r.status_code == 200
    js = r.get_json()
    assert js["total"] >= 1
    names = [i["name"] for i in js["items"]]
    assert any("Rose Gold" in n for n in names)
