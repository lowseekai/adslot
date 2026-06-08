# AdSlot

Lightweight Flarum extension for a merchant showcase wall.

This extension stays isolated inside the standalone `adslot` folder and is not merged into the main project code.

Included scope:

- public merchant wall
- self-submit form
- admin review list
- approve / reject / edit / delete
- manual visibility and sort order
- optional start and end time

If you want to install it locally, use a Composer path repository:

```json
{
  "repositories": [
    {
      "type": "path",
      "url": "adslot",
      "options": {
        "symlink": true
      }
    }
  ]
}
```

Then run:

```bash
composer require doingfb/adslot:@dev
php flarum migrate
php flarum cache:clear
```

Main files:

- `PRD.md`: Chinese simplified PRD
- `wireframe.html`: rough page sketch
- `extend.php`: extension entry
- `migrations/`: single-table schema
- `src/`: PHP backend
- `js/src/`: forum and admin frontend
