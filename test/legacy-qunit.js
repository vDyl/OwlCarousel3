(function(QUnit, window) {
	window.module = QUnit.module;
	window.test = function(name, callback) {
		QUnit.test(name, function(assert) {
			var assertions = {
				deepEqual: window.deepEqual,
				equal: window.equal,
				expect: window.expect,
				ok: window.ok
			};

			window.deepEqual = function(actual, expected, message) { assert.deepEqual(actual, expected, message); };
			window.equal = function(actual, expected, message) { assert.equal(actual, expected, message); };
			window.expect = function(amount) { assert.expect(amount); };
			window.ok = function(value, message) { assert.ok(value, message); };

			try {
				callback();
			} finally {
				window.deepEqual = assertions.deepEqual;
				window.equal = assertions.equal;
				window.expect = assertions.expect;
				window.ok = assertions.ok;
			}
		});
	};

	QUnit.done(function() {
		window.__qunitDone = true;
	});
})(QUnit, window);
